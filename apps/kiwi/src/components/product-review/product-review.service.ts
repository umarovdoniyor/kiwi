import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateProductReviewInput,
  ProductReview,
  ProductReviewsInquiry,
  ProductReviewsPayload,
  ProductReviewSummary,
  ReviewsByAdminInquiry,
  UpdateProductReviewInput,
  UpdateReviewStatusByAdminInput,
} from '../../libs/dto/product-review/product-review';
import { Message } from '../../libs/enums/common.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import {
  ProductReviewSortBy,
  ProductReviewStatus,
} from '../../libs/enums/product-review.enum';

@Injectable()
export class ProductReviewService {
  constructor(
    @InjectModel('ProductReview')
    private readonly productReviewModel: Model<any>,
    @InjectModel('Product')
    private readonly productModel: Model<any>,
    @InjectModel('OrderItem')
    private readonly orderItemModel: Model<any>,
    @InjectModel('Member')
    private readonly memberModel: Model<any>,
  ) {}

  private readonly strictReviewOrderStatuses: OrderStatus[] = [
    OrderStatus.DELIVERED,
  ];

  private readonly relaxedReviewOrderStatuses: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PACKING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];

  private getAllowedReviewOrderStatuses(): OrderStatus[] {
    const explicitStatusesRaw = process.env.REVIEW_ELIGIBLE_ORDER_STATUSES;

    if (explicitStatusesRaw?.trim()) {
      const statusSet = new Set<OrderStatus>();
      const allowedValues = new Set<string>(Object.values(OrderStatus));

      for (const token of explicitStatusesRaw.split(',')) {
        const normalized = token.trim().toUpperCase();
        if (allowedValues.has(normalized)) {
          statusSet.add(normalized as OrderStatus);
        }
      }

      if (statusSet.size > 0) {
        return Array.from(statusSet);
      }
    }

    const mode =
      process.env.REVIEW_VERIFIED_ORDER_MODE?.trim().toUpperCase() || 'RELAXED';

    return mode === 'STRICT'
      ? this.strictReviewOrderStatuses
      : this.relaxedReviewOrderStatuses;
  }

  private toReviewMember(doc: any): any {
    if (!doc?.memberSnapshot) {
      return null;
    }

    return {
      _id: doc.memberId.toString(),
      memberNickname: doc.memberSnapshot.memberNickname || null,
      memberFirstName: doc.memberSnapshot.memberFirstName || null,
      memberLastName: doc.memberSnapshot.memberLastName || null,
      memberAvatar: doc.memberSnapshot.memberAvatar || null,
    };
  }

  private toProductReview(doc: any): ProductReview {
    return {
      _id: doc._id.toString(),
      productId: doc.productId.toString(),
      memberId: doc.memberId.toString(),
      orderId: doc.orderId ? doc.orderId.toString() : null,
      rating: doc.rating,
      comment: doc.comment,
      images: doc.images || [],
      status: doc.status,
      moderationReason: doc.moderationReason,
      moderatedBy: doc.moderatedBy ? doc.moderatedBy.toString() : null,
      moderatedAt: doc.moderatedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      member: this.toReviewMember(doc),
    };
  }

  private buildPublicSort(sortBy?: ProductReviewSortBy): any {
    switch (sortBy || ProductReviewSortBy.NEWEST) {
      case ProductReviewSortBy.OLDEST:
        return { createdAt: 1, _id: 1 };
      case ProductReviewSortBy.RATING_DESC:
        return { rating: -1, createdAt: -1, _id: 1 };
      case ProductReviewSortBy.RATING_ASC:
        return { rating: 1, createdAt: -1, _id: 1 };
      case ProductReviewSortBy.WITH_IMAGES:
        return { createdAt: -1, _id: 1 };
      case ProductReviewSortBy.NEWEST:
      default:
        return { createdAt: -1, _id: 1 };
    }
  }

  private async ensureProductExists(productId: string): Promise<void> {
    const productResult = await this.productModel
      .findOne({
        _id: productId,
        deletedAt: null,
      })
      .select('_id status')
      .lean()
      .exec();

    const product: any = Array.isArray(productResult)
      ? productResult[0]
      : productResult;

    if (!product) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      throw new BadRequestException('Only published products can be reviewed');
    }
  }

  private async getVerifiedOrderId(
    memberId: string,
    productId: string,
  ): Promise<string | null> {
    const eligibleStatuses = this.getAllowedReviewOrderStatuses();

    const match = await this.orderItemModel
      .aggregate([
        {
          $match: {
            memberId: new Types.ObjectId(memberId),
            productId: new Types.ObjectId(productId),
          },
        },
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order',
          },
        },
        { $unwind: '$order' },
        {
          $match: {
            'order.memberId': new Types.ObjectId(memberId),
            'order.status': { $in: eligibleStatuses },
          },
        },
        { $project: { orderId: 1 } },
        { $limit: 1 },
      ])
      .exec();

    const orderId = match?.[0]?.orderId;
    return orderId ? orderId.toString() : null;
  }

  private async recalculateProductReviewStats(
    productId: string,
  ): Promise<void> {
    const [summary] = await this.productReviewModel
      .aggregate([
        {
          $match: {
            productId: new Types.ObjectId(productId),
            status: ProductReviewStatus.PUBLISHED,
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: null,
            reviewsCount: { $sum: 1 },
            ratingAvg: { $avg: '$rating' },
          },
        },
      ])
      .exec();

    await this.productModel
      .updateOne(
        { _id: productId },
        {
          $set: {
            reviewsCount: Number(summary?.reviewsCount || 0),
            ratingAvg: Number((summary?.ratingAvg || 0).toFixed(2)),
          },
        },
      )
      .exec();
  }

  private async buildSummary(match: any): Promise<ProductReviewSummary> {
    const [summary] = await this.productReviewModel
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            reviewsCount: { $sum: 1 },
            ratingAvg: { $avg: '$rating' },
            rating1Count: {
              $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] },
            },
            rating2Count: {
              $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] },
            },
            rating3Count: {
              $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] },
            },
            rating4Count: {
              $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] },
            },
            rating5Count: {
              $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
            },
          },
        },
      ])
      .exec();

    return {
      ratingAvg: Number((summary?.ratingAvg || 0).toFixed(2)),
      reviewsCount: Number(summary?.reviewsCount || 0),
      rating1Count: Number(summary?.rating1Count || 0),
      rating2Count: Number(summary?.rating2Count || 0),
      rating3Count: Number(summary?.rating3Count || 0),
      rating4Count: Number(summary?.rating4Count || 0),
      rating5Count: Number(summary?.rating5Count || 0),
    };
  }

  public async getProductReviews(
    input: ProductReviewsInquiry,
  ): Promise<ProductReviewsPayload> {
    try {
      const page = input?.page ?? 1;
      const limit = Math.min(Math.max(input?.limit ?? 10, 1), 50);
      const skip = (page - 1) * limit;

      const filter: any = {
        productId: input.productId,
        status: ProductReviewStatus.PUBLISHED,
        deletedAt: null,
      };

      if (input?.sortBy === ProductReviewSortBy.WITH_IMAGES) {
        filter['images.0'] = { $exists: true };
      }

      const [list, total, summary] = await Promise.all([
        this.productReviewModel
          .find(filter)
          .sort(this.buildPublicSort(input?.sortBy))
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productReviewModel.countDocuments(filter).exec(),
        this.buildSummary({
          productId: input.productId,
          status: ProductReviewStatus.PUBLISHED,
          deletedAt: null,
        }),
      ]);

      return {
        list: list.map((doc: any) => this.toProductReview(doc)),
        metaCounter: { total },
        summary,
      };
    } catch (err) {
      console.log('Error, Service.getProductReviews', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getMyProductReview(
    memberId: string,
    productId: string,
  ): Promise<ProductReview | null> {
    try {
      const review = await this.productReviewModel
        .findOne({
          memberId,
          productId,
          deletedAt: null,
        })
        .sort({ createdAt: -1 })
        .exec();

      if (!review) {
        return null;
      }

      return this.toProductReview(review);
    } catch (err) {
      console.log('Error, Service.getMyProductReview', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getReviewsByAdmin(
    input: ReviewsByAdminInquiry,
  ): Promise<ProductReviewsPayload> {
    try {
      const page = input?.page ?? 1;
      const limit = Math.min(Math.max(input?.limit ?? 20, 1), 100);
      const skip = (page - 1) * limit;

      const filter: any = {
        deletedAt: null,
        ...(input?.status ? { status: input.status } : {}),
        ...(input?.productId ? { productId: input.productId } : {}),
        ...(input?.memberId ? { memberId: input.memberId } : {}),
      };

      if (input?.search?.trim()) {
        const keyword = input.search.trim();
        filter.$or = [
          { comment: { $regex: keyword, $options: 'i' } },
          {
            'memberSnapshot.memberNickname': { $regex: keyword, $options: 'i' },
          },
          {
            'memberSnapshot.memberFirstName': {
              $regex: keyword,
              $options: 'i',
            },
          },
          {
            'memberSnapshot.memberLastName': { $regex: keyword, $options: 'i' },
          },
        ];
      }

      const [list, total, summary] = await Promise.all([
        this.productReviewModel
          .find(filter)
          .sort({ createdAt: -1, _id: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productReviewModel.countDocuments(filter).exec(),
        this.buildSummary(filter),
      ]);

      return {
        list: list.map((doc: any) => this.toProductReview(doc)),
        metaCounter: { total },
        summary,
      };
    } catch (err) {
      console.log('Error, Service.getReviewsByAdmin', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async createProductReview(
    memberId: string,
    input: CreateProductReviewInput,
  ): Promise<ProductReview> {
    try {
      await this.ensureProductExists(input.productId);

      const existing = await this.productReviewModel
        .findOne({
          productId: input.productId,
          memberId,
          deletedAt: null,
        })
        .exec();

      if (existing) {
        throw new BadRequestException(
          'You already have an active review for this product',
        );
      }

      const verifiedOrderId = await this.getVerifiedOrderId(
        memberId,
        input.productId,
      );
      if (!verifiedOrderId) {
        throw new BadRequestException(
          'Only verified buyers can review this product',
        );
      }

      const memberResult = await this.memberModel
        .findById(memberId)
        .select(
          '_id memberNickname memberFirstName memberLastName memberAvatar',
        )
        .lean()
        .exec();

      const member: any = Array.isArray(memberResult)
        ? memberResult[0]
        : memberResult;

      if (!member) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const created = await this.productReviewModel.create({
        productId: input.productId,
        memberId,
        orderId: verifiedOrderId,
        rating: input.rating,
        comment: input.comment?.trim() || null,
        images: input.images || [],
        status: ProductReviewStatus.PENDING,
        memberSnapshot: {
          memberNickname: member.memberNickname || null,
          memberFirstName: member.memberFirstName || null,
          memberLastName: member.memberLastName || null,
          memberAvatar: member.memberAvatar || null,
        },
      });

      return this.toProductReview(created);
    } catch (err) {
      console.log('Error, Service.createProductReview', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException(
          'You already have an active review for this product',
        );
      }
      throw new BadRequestException(err.message || Message.CREATE_FAILED);
    }
  }

  public async updateProductReview(
    memberId: string,
    input: UpdateProductReviewInput,
  ): Promise<ProductReview> {
    try {
      const review = await this.productReviewModel
        .findOne({
          _id: input.reviewId,
          memberId,
          deletedAt: null,
        })
        .exec();

      if (!review) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      if (
        review.status === ProductReviewStatus.HIDDEN ||
        review.status === ProductReviewStatus.REJECTED
      ) {
        throw new BadRequestException(
          'This review cannot be updated in its current status',
        );
      }

      const hadPublishedStatus =
        review.status === ProductReviewStatus.PUBLISHED;

      if (input.rating !== undefined) {
        review.rating = input.rating;
      }

      if (input.comment !== undefined) {
        review.comment = input.comment?.trim() || null;
      }

      if (input.images !== undefined) {
        review.images = input.images || [];
      }

      if (hadPublishedStatus) {
        review.status = ProductReviewStatus.PENDING;
        review.moderatedBy = null;
        review.moderatedAt = null;
        review.moderationReason = null;
      }

      await review.save();

      if (hadPublishedStatus) {
        await this.recalculateProductReviewStats(review.productId.toString());
      }

      return this.toProductReview(review);
    } catch (err) {
      console.log('Error, Service.updateProductReview', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async removeProductReview(
    memberId: string,
    reviewId: string,
  ): Promise<boolean> {
    try {
      const review = await this.productReviewModel
        .findOne({
          _id: reviewId,
          memberId,
          deletedAt: null,
        })
        .exec();

      if (!review) {
        return true;
      }

      const hadPublishedStatus =
        review.status === ProductReviewStatus.PUBLISHED;
      review.deletedAt = new Date();
      await review.save();

      if (hadPublishedStatus) {
        await this.recalculateProductReviewStats(review.productId.toString());
      }

      return true;
    } catch (err) {
      console.log('Error, Service.removeProductReview', err.message);
      throw new BadRequestException(err.message || Message.REMOVE_FAILED);
    }
  }

  public async updateReviewStatusByAdmin(
    adminId: string,
    input: UpdateReviewStatusByAdminInput,
  ): Promise<ProductReview> {
    try {
      const review = await this.productReviewModel
        .findOne({
          _id: input.reviewId,
          deletedAt: null,
        })
        .exec();

      if (!review) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const previousStatus = review.status;
      review.status = input.status;
      review.moderationReason = input.reason?.trim() || null;
      review.moderatedBy = adminId;
      review.moderatedAt = new Date();
      await review.save();

      if (
        previousStatus === ProductReviewStatus.PUBLISHED ||
        input.status === ProductReviewStatus.PUBLISHED
      ) {
        await this.recalculateProductReviewStats(review.productId.toString());
      }

      return this.toProductReview(review);
    } catch (err) {
      console.log('Error, Service.updateReviewStatusByAdmin', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }
}
