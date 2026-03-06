import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddToWishlistInput,
  AddToWishlistOutput,
  GetMyWishlistInput,
  GetMyWishlistOutput,
  GetWishlistStatusInput,
  GetWishlistStatusOutput,
  MetaCounterDTO,
  RemoveFromWishlistInput,
  RemoveFromWishlistOutput,
  WishlistItemDTO,
  WishlistProductDTO,
} from '../../libs/dto/wishlist/wishlist';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel('Wishlist')
    private readonly wishlistModel: Model<any>,
    @InjectModel('Product')
    private readonly productModel: Model<any>,
  ) {}

  private buildFallbackSlug(product: any): string {
    const base = String(product?.title || 'product')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const suffix = product?._id?.toString()?.slice(-6) || 'item';
    const normalizedBase = base || 'product';

    return `${normalizedBase}-${suffix}`;
  }

  private toWishlistProductDTO(product: any): WishlistProductDTO {
    return {
      _id: product._id.toString(),
      slug: product.slug || this.buildFallbackSlug(product),
      title: product.title,
      thumbnail: product.thumbnail || null,
      price: product.price,
      salePrice: product.salePrice,
      status: product.status,
    };
  }

  private toWishlistItemDTO(item: any, product: any): WishlistItemDTO {
    return {
      _id: item._id.toString(),
      memberId: item.memberId.toString(),
      productId: item.productId.toString(),
      createdAt: item.createdAt,
      product: this.toWishlistProductDTO(product),
    };
  }

  private buildMetaCounter(
    page: number,
    limit: number,
    total: number,
  ): MetaCounterDTO {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  public async addToWishlist(
    memberId: string,
    input: AddToWishlistInput,
  ): Promise<AddToWishlistOutput> {
    try {
      const product = await this.productModel
        .findOne({ _id: input.productId, deletedAt: null })
        .exec();

      if (!product) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const existing = await this.wishlistModel
        .findOne({ memberId, productId: input.productId })
        .exec();

      if (existing) {
        return {
          success: true,
          message: 'Already in wishlist',
          wishlistItem: this.toWishlistItemDTO(existing, product),
        };
      }

      const created = await this.wishlistModel.create({
        memberId,
        productId: input.productId,
      });

      return {
        success: true,
        message: 'Added to wishlist',
        wishlistItem: this.toWishlistItemDTO(created, product),
      };
    } catch (err) {
      console.log('Error, Service.addToWishlist', err.message);
      if (err?.code === 11000) {
        const existing = await this.wishlistModel
          .findOne({ memberId, productId: input.productId })
          .exec();
        if (!existing) {
          throw new BadRequestException(Message.BAD_REQUEST);
        }
        const product = await this.productModel
          .findOne({ _id: input.productId, deletedAt: null })
          .exec();
        if (!product) {
          throw new BadRequestException(Message.NO_DATA_FOUND);
        }
        return {
          success: true,
          message: 'Already in wishlist',
          wishlistItem: this.toWishlistItemDTO(existing, product),
        };
      }
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async removeFromWishlist(
    memberId: string,
    input: RemoveFromWishlistInput,
  ): Promise<RemoveFromWishlistOutput> {
    try {
      const deleted = await this.wishlistModel
        .findOneAndDelete({ memberId, productId: input.productId })
        .exec();

      if (!deleted) {
        return {
          success: true,
          message: 'Item was not in wishlist',
          removedProductId: input.productId,
        };
      }

      return {
        success: true,
        message: 'Removed from wishlist',
        removedProductId: input.productId,
      };
    } catch (err) {
      console.log('Error, Service.removeFromWishlist', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getMyWishlist(
    memberId: string,
    input: GetMyWishlistInput,
  ): Promise<GetMyWishlistOutput> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.wishlistModel
          .find({ memberId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.wishlistModel.countDocuments({ memberId }).exec(),
      ]);

      const productIds = items.map((item) => item.productId);
      const products = await this.productModel
        .find({ _id: { $in: productIds } })
        .exec();

      const productMap = new Map<string, any>(
        products.map((product) => [product._id.toString(), product]),
      );

      const list = items
        .map((item) => {
          const product = productMap.get(item.productId.toString());
          if (!product) {
            return null;
          }
          return this.toWishlistItemDTO(item, product);
        })
        .filter((item): item is WishlistItemDTO => !!item);

      return {
        list,
        metaCounter: this.buildMetaCounter(page, limit, total),
      };
    } catch (err) {
      console.log('Error, Service.getMyWishlist', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getWishlistStatus(
    memberId: string,
    input: GetWishlistStatusInput,
  ): Promise<GetWishlistStatusOutput> {
    try {
      const dedupedProductIds = Array.from(new Set(input.productIds));

      if (dedupedProductIds.length === 0) {
        throw new BadRequestException('productIds must not be empty');
      }

      if (dedupedProductIds.length > 100) {
        throw new BadRequestException('productIds length must be <= 100');
      }

      const objectIds = dedupedProductIds.map((id) => new Types.ObjectId(id));

      const wishlistedRows = await this.wishlistModel
        .find({ memberId, productId: { $in: objectIds } })
        .select('productId')
        .exec();

      const wishlistedSet = new Set(
        wishlistedRows.map((row) => row.productId.toString()),
      );

      return {
        list: dedupedProductIds.map((productId) => ({
          productId,
          isWishlisted: wishlistedSet.has(productId),
        })),
      };
    } catch (err) {
      console.log('Error, Service.getWishlistStatus', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }
}
