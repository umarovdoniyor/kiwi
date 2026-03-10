import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enums';
import { ProductSortBy, ProductStatus } from '../../libs/enums/product.enum';
import { ProductReviewSortBy } from '../../libs/enums/product-review.enum';
import {
  memberStatusToVendorStatus,
  vendorStatusToMemberStatus,
  VendorSortBy,
} from '../../libs/enums/vendor.enum';
import {
  UpdateMyVendorProfileInput,
  VendorDetail,
  VendorProfile,
  VendorProductsInquiry,
  VendorsInquiry,
  VendorsPayload,
  VendorSummary,
} from '../../libs/dto/vendor/vendor';
import { ProductCard, ProductPayload } from '../../libs/dto/product/product';
import {
  ProductReviewSummary,
  VendorProductReview,
  VendorProductReviewsInquiryInput,
  VendorProductReviewsMetaCounter,
  VendorProductReviewsPage,
} from '../../libs/dto/product-review/product-review';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<any>,
    @InjectModel('Product') private readonly productModel: Model<any>,
    @InjectModel('ProductReview')
    private readonly productReviewModel: Model<any>,
  ) {}

  private normalizeSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private buildVendorSlug(doc: any): string {
    const preferredStoreName =
      doc?.vendorProfile?.storeName || doc?.memberNickname;
    const base = this.normalizeSlug(preferredStoreName || 'vendor') || 'vendor';
    const id = doc?._id?.toString() || 'vendor';
    return `${base}-${id}`;
  }

  private mapVendorSummary(doc: any): VendorSummary {
    return {
      _id: doc._id.toString(),
      slug: this.buildVendorSlug(doc),
      storeName: doc.vendorProfile?.storeName || doc.memberNickname || 'Vendor',
      memberPhone: doc.memberPhone || null,
      memberAddress: doc.memberAddress || null,
      memberImage: doc.memberAvatar || null,
      coverImage: undefined,
      verified: !!(doc.isEmailVerified || doc.isPhoneVerified),
      status: memberStatusToVendorStatus[doc.memberStatus as MemberStatus],
      socialLinks: undefined,
      productsCount: Number(doc.productsCount || 0),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private mapVendorDetail(doc: any): VendorDetail {
    const summary = this.mapVendorSummary(doc);

    return {
      ...summary,
      storeDescription: doc.vendorProfile?.storeDescription || null,
      memberEmail: doc.memberEmail || null,
    };
  }

  private mapMyVendorProfile(doc: any): VendorProfile {
    const status = memberStatusToVendorStatus[doc.memberStatus as MemberStatus];

    return {
      _id: doc._id.toString(),
      memberId: doc._id.toString(),
      storeName: doc.vendorProfile?.storeName || doc.memberNickname || 'Vendor',
      storeDescription: doc.vendorProfile?.storeDescription || null,
      coverImageUrl: doc.vendorProfile?.coverImageUrl || null,
      category: doc.vendorProfile?.category || null,
      minimumOrderQty:
        doc.vendorProfile?.minimumOrderQty !== undefined &&
        doc.vendorProfile?.minimumOrderQty !== null
          ? Number(doc.vendorProfile.minimumOrderQty)
          : null,
      status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private buildSort(sortBy?: VendorSortBy): any {
    switch (sortBy || VendorSortBy.NEWEST) {
      case VendorSortBy.OLDEST:
        return { createdAt: 1, _id: 1 };
      case VendorSortBy.NAME_ASC:
        return { normalizedStoreName: 1, createdAt: -1, _id: 1 };
      case VendorSortBy.NAME_DESC:
        return { normalizedStoreName: -1, createdAt: -1, _id: 1 };
      case VendorSortBy.POPULAR:
        return { productsCount: -1, createdAt: -1, _id: 1 };
      case VendorSortBy.NEWEST:
      default:
        return { createdAt: -1, _id: 1 };
    }
  }

  private buildProductSort(sortBy?: ProductSortBy): any {
    switch (sortBy || ProductSortBy.NEWEST) {
      case ProductSortBy.PRICE_ASC:
        return { effectivePrice: 1, createdAt: -1, _id: 1 };
      case ProductSortBy.PRICE_DESC:
        return { effectivePrice: -1, createdAt: -1, _id: 1 };
      case ProductSortBy.POPULAR:
        return { popularityScore: -1, createdAt: -1, _id: 1 };
      case ProductSortBy.NEWEST:
      default:
        return { createdAt: -1, _id: 1 };
    }
  }

  private toProductCard(product: any): ProductCard {
    const fallbackBase =
      this.normalizeSlug(product?.title || 'product') || 'product';
    const fallbackSlug = `${fallbackBase}-${product?._id?.toString()?.slice(-6) || 'item'}`;

    return {
      _id: product._id.toString(),
      title: product.title,
      slug: product.slug || fallbackSlug,
      thumbnail: product.thumbnail || null,
      price: product.price,
      salePrice: product.salePrice,
      stockQty: product.stockQty,
      status: product.status,
      likes: product.likes,
      views: product.views,
      ratingAvg: Number(product.ratingAvg || 0),
      reviewsCount: Number(product.reviewsCount || 0),
      createdAt: product.createdAt,
    };
  }

  private buildReviewSort(sortBy?: ProductReviewSortBy): any {
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

  private buildReviewMetaCounter(
    page: number,
    limit: number,
    total: number,
  ): VendorProductReviewsMetaCounter {
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  private mapVendorProductReview(doc: any): VendorProductReview {
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
      member: {
        _id: doc.memberId.toString(),
        memberNickname: doc.memberSnapshot?.memberNickname || null,
        memberFirstName: doc.memberSnapshot?.memberFirstName || null,
        memberLastName: doc.memberSnapshot?.memberLastName || null,
        memberAvatar: doc.memberSnapshot?.memberAvatar || null,
      },
      product: doc.product
        ? {
            _id: doc.product._id.toString(),
            title: doc.product.title,
            thumbnail: doc.product.thumbnail || null,
            slug: doc.product.slug || null,
          }
        : undefined,
    };
  }

  private buildReviewSummaryFromAgg(summary: any): ProductReviewSummary {
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

  public async getVendors(input: VendorsInquiry): Promise<VendorsPayload> {
    try {
      const page = input?.page ?? 1;
      const limit = Math.min(Math.max(input?.limit ?? 12, 1), 50);
      const skip = (page - 1) * limit;

      const match: any = {
        memberType: MemberType.VENDOR,
      };

      if (input?.status) {
        match.memberStatus = vendorStatusToMemberStatus[input.status];
      }

      if (input?.search?.trim()) {
        const keyword = input.search.trim();
        match.$or = [
          { 'vendorProfile.storeName': { $regex: keyword, $options: 'i' } },
          { memberNickname: { $regex: keyword, $options: 'i' } },
          { memberEmail: { $regex: keyword, $options: 'i' } },
        ];
      }

      const [result] = await this.memberModel
        .aggregate([
          { $match: match },
          {
            $lookup: {
              from: 'products',
              let: { vendorId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$memberId', '$$vendorId'] },
                        { $eq: ['$status', ProductStatus.PUBLISHED] },
                        { $eq: ['$deletedAt', null] },
                      ],
                    },
                  },
                },
                { $count: 'count' },
              ],
              as: 'productsMeta',
            },
          },
          {
            $addFields: {
              productsCount: {
                $ifNull: [{ $arrayElemAt: ['$productsMeta.count', 0] }, 0],
              },
              normalizedStoreName: {
                $toLower: {
                  $ifNull: ['$vendorProfile.storeName', '$memberNickname'],
                },
              },
            },
          },
          {
            $facet: {
              list: [
                { $sort: this.buildSort(input?.sortBy) },
                { $skip: skip },
                { $limit: limit },
                {
                  $project: {
                    _id: 1,
                    memberPhone: 1,
                    memberAddress: 1,
                    memberAvatar: 1,
                    memberStatus: 1,
                    memberNickname: 1,
                    isEmailVerified: 1,
                    isPhoneVerified: 1,
                    vendorProfile: 1,
                    productsCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                  },
                },
              ],
              total: [{ $count: 'count' }],
            },
          },
          {
            $project: {
              list: 1,
              total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
            },
          },
        ])
        .exec();

      return {
        list: (result?.list || []).map((doc: any) =>
          this.mapVendorSummary(doc),
        ),
        metaCounter: { total: result?.total || 0 },
      };
    } catch (err) {
      console.log('Error, Service.getVendors', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getVendorBySlug(slug: string): Promise<VendorDetail | null> {
    try {
      const normalizedSlug = (slug || '').trim().toLowerCase();
      const idMatch = normalizedSlug.match(/-([a-f0-9]{24})$/);

      if (!idMatch) {
        return null;
      }

      const vendorId = idMatch[1];
      const vendor = await this.memberModel
        .findOne({
          _id: vendorId,
          memberType: MemberType.VENDOR,
        })
        .lean()
        .exec();

      if (!vendor) {
        return null;
      }

      const expectedSlug = this.buildVendorSlug(vendor).toLowerCase();
      if (expectedSlug !== normalizedSlug) {
        return null;
      }

      const productsCount = await this.productModel
        .countDocuments({
          memberId: new Types.ObjectId(vendorId),
          status: ProductStatus.PUBLISHED,
          deletedAt: null,
        })
        .exec();

      return this.mapVendorDetail({
        ...vendor,
        productsCount,
      });
    } catch (err) {
      console.log('Error, Service.getVendorBySlug', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getVendorProducts(
    vendorId: string,
    input: VendorProductsInquiry,
  ): Promise<ProductPayload> {
    try {
      const vendor = await this.memberModel
        .findOne({
          _id: vendorId,
          memberType: MemberType.VENDOR,
        })
        .select('_id')
        .lean()
        .exec();

      if (!vendor) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const page = input?.page ?? 1;
      const limit = Math.min(Math.max(input?.limit ?? 12, 1), 50);
      const skip = (page - 1) * limit;

      const [result] = await this.productModel
        .aggregate([
          {
            $match: {
              memberId: new Types.ObjectId(vendorId),
              status: ProductStatus.PUBLISHED,
              deletedAt: null,
            },
          },
          {
            $addFields: {
              effectivePrice: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$salePrice', null] },
                      { $lt: ['$salePrice', '$price'] },
                    ],
                  },
                  '$salePrice',
                  '$price',
                ],
              },
              popularityScore: {
                $add: [
                  { $multiply: ['$ordersCount', 5] },
                  { $multiply: ['$likes', 2] },
                  { $multiply: ['$views', 0.2] },
                ],
              },
            },
          },
          {
            $facet: {
              list: [
                { $sort: this.buildProductSort(input?.sortBy) },
                { $skip: skip },
                { $limit: limit },
                {
                  $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    thumbnail: 1,
                    price: 1,
                    salePrice: 1,
                    stockQty: 1,
                    status: 1,
                    likes: 1,
                    views: 1,
                    ratingAvg: 1,
                    reviewsCount: 1,
                    createdAt: 1,
                  },
                },
              ],
              total: [{ $count: 'count' }],
            },
          },
          {
            $project: {
              list: 1,
              total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
            },
          },
        ])
        .exec();

      return {
        list: (result?.list || []).map((product: any) =>
          this.toProductCard(product),
        ),
        metaCounter: { total: result?.total || 0 },
      };
    } catch (err) {
      console.log('Error, Service.getVendorProducts', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getMyVendorProfile(vendorId: string): Promise<VendorProfile> {
    try {
      const vendor = await this.memberModel
        .findOne({
          _id: vendorId,
          memberType: MemberType.VENDOR,
        })
        .select('_id memberStatus memberNickname vendorProfile createdAt updatedAt')
        .lean()
        .exec();

      if (!vendor) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return this.mapMyVendorProfile(vendor);
    } catch (err) {
      console.log('Error, Service.getMyVendorProfile', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async updateMyVendorProfile(
    vendorId: string,
    input: UpdateMyVendorProfileInput,
  ): Promise<VendorProfile> {
    try {
      const updateSet: any = {};

      if (input.storeName !== undefined) {
        updateSet['vendorProfile.storeName'] = input.storeName.trim();
      }

      if (input.storeDescription !== undefined) {
        updateSet['vendorProfile.storeDescription'] =
          input.storeDescription.trim();
      }

      if (input.coverImageUrl !== undefined) {
        updateSet['vendorProfile.coverImageUrl'] = input.coverImageUrl.trim();
      }

      if (input.category !== undefined) {
        updateSet['vendorProfile.category'] = input.category.trim();
      }

      if (input.minimumOrderQty !== undefined) {
        updateSet['vendorProfile.minimumOrderQty'] = input.minimumOrderQty;
      }

      if (Object.keys(updateSet).length === 0) {
        return await this.getMyVendorProfile(vendorId);
      }

      const vendor = await this.memberModel
        .findOneAndUpdate(
          {
            _id: vendorId,
            memberType: MemberType.VENDOR,
          },
          { $set: updateSet },
          {
            new: true,
            runValidators: true,
          },
        )
        .select('_id memberStatus memberNickname vendorProfile createdAt updatedAt')
        .lean()
        .exec();

      if (!vendor) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return this.mapMyVendorProfile(vendor);
    } catch (err) {
      console.log('Error, Service.updateMyVendorProfile', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async getVendorProductReviews(
    vendorId: string,
    input: VendorProductReviewsInquiryInput,
  ): Promise<VendorProductReviewsPage> {
    try {
      const page = input?.page ?? 1;
      const limit = Math.min(Math.max(input?.limit ?? 10, 1), 50);
      const skip = (page - 1) * limit;

      const basePipeline: any[] = [
        { $match: { deletedAt: null } },
        {
          $lookup: {
            from: 'products',
            let: { productId: '$productId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$productId'] },
                      { $eq: ['$memberId', new Types.ObjectId(vendorId)] },
                      { $eq: ['$deletedAt', null] },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  thumbnail: 1,
                  slug: 1,
                },
              },
            ],
            as: 'product',
          },
        },
        { $unwind: '$product' },
      ];

      if (input?.status) {
        basePipeline.push({ $match: { status: input.status } });
      }

      if (input?.productId) {
        basePipeline.push({
          $match: { productId: new Types.ObjectId(input.productId) },
        });
      }

      if (input?.rating) {
        basePipeline.push({ $match: { rating: input.rating } });
      }

      if (input?.sortBy === ProductReviewSortBy.WITH_IMAGES) {
        basePipeline.push({ $match: { 'images.0': { $exists: true } } });
      }

      if (input?.search?.trim()) {
        const keyword = input.search.trim();
        basePipeline.push({
          $match: {
            $or: [
              { comment: { $regex: keyword, $options: 'i' } },
              {
                'memberSnapshot.memberNickname': {
                  $regex: keyword,
                  $options: 'i',
                },
              },
              {
                'memberSnapshot.memberFirstName': {
                  $regex: keyword,
                  $options: 'i',
                },
              },
              {
                'memberSnapshot.memberLastName': {
                  $regex: keyword,
                  $options: 'i',
                },
              },
              { 'product.title': { $regex: keyword, $options: 'i' } },
            ],
          },
        });
      }

      const [result, summaryAgg] = await Promise.all([
        this.productReviewModel
          .aggregate([
            ...basePipeline,
            {
              $facet: {
                list: [
                  { $sort: this.buildReviewSort(input?.sortBy) },
                  { $skip: skip },
                  { $limit: limit },
                  {
                    $project: {
                      _id: 1,
                      productId: 1,
                      memberId: 1,
                      orderId: 1,
                      rating: 1,
                      comment: 1,
                      images: 1,
                      status: 1,
                      moderationReason: 1,
                      moderatedBy: 1,
                      moderatedAt: 1,
                      createdAt: 1,
                      updatedAt: 1,
                      memberSnapshot: 1,
                      product: 1,
                    },
                  },
                ],
                total: [{ $count: 'count' }],
              },
            },
            {
              $project: {
                list: 1,
                total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
              },
            },
          ])
          .exec(),
        this.productReviewModel
          .aggregate([
            ...basePipeline,
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
          .exec(),
      ]);

      const total = Number(result?.[0]?.total || 0);

      return {
        list: (result?.[0]?.list || []).map((doc: any) =>
          this.mapVendorProductReview(doc),
        ),
        metaCounter: this.buildReviewMetaCounter(page, limit, total),
        summary: this.buildReviewSummaryFromAgg(summaryAgg?.[0]),
      };
    } catch (err) {
      console.log('Error, Service.getVendorProductReviews', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }
}
