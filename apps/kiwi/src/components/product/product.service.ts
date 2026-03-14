import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AdminProductsInquiry,
  CatalogProducts,
  CatalogProductsInquiry,
  CreateProductInput,
  FeaturedProductsInquiry,
  MyProductsInquiry,
  MyProductsResponse,
  PopularProductsInquiry,
  ProductCard,
  ProductDetail,
  ProductResponse,
  ProductVendor,
  RelatedProductsInquiry,
  RemoveProductInput,
  SearchSuggestion,
  SearchSuggestionsInput,
  SetProductFeaturedByAdminInput,
  TrendingProductsInquiry,
  UpdateProductInput,
  UpdateProductStatusByAdminInput,
} from '../../libs/dto/product/product';
import { ProductSortBy, ProductStatus } from '../../libs/enums/product.enum';
import { CategoryStatus } from '../../libs/enums/product-category.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { Message } from '../../libs/enums/common.enum';
import type { JwtPayload } from '../../libs/types/common';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel('Product')
    private readonly productModel: Model<any>,
    @InjectModel('Category')
    private readonly categoryModel: Model<any>,
    @InjectModel('Like')
    private readonly likeModel: Model<any>,
    @InjectModel('View')
    private readonly viewModel: Model<any>,
    @InjectModel('Member')
    private readonly memberModel: Model<any>,
    @InjectModel('OrderItem')
    private readonly orderItemModel: Model<any>,
  ) {}

  private readonly maxCatalogLimit = 50;
  private readonly defaultSuggestionLimit = 6;
  private readonly maxSuggestionLimit = 8;
  private readonly defaultAssetBaseUrl = 'http://localhost:3007';

  private resolveAssetBaseUrl(): string {
    return (process.env.APP_URL ?? this.defaultAssetBaseUrl)
      .trim()
      .replace(/\/$/, '');
  }

  private toRelativeUploadPath(
    value?: string | null,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return trimmed;
    }

    if (trimmed.startsWith('/uploads/')) {
      return trimmed;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${parsed.pathname}${parsed.search || ''}${parsed.hash || ''}`;
      }
    } catch {
      return trimmed;
    }

    return trimmed;
  }

  private toPublicAssetUrl(value?: string | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return trimmed;
    }

    if (trimmed.startsWith('/uploads/')) {
      return `${this.resolveAssetBaseUrl()}${trimmed}`;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${this.resolveAssetBaseUrl()}${parsed.pathname}${parsed.search || ''}${parsed.hash || ''}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  private normalizeMediaInput<
    T extends { images?: string[]; thumbnail?: string },
  >(input: T): T {
    return {
      ...input,
      images: input.images?.map(
        (image) => this.toRelativeUploadPath(image) || '',
      ),
      thumbnail: this.toRelativeUploadPath(input.thumbnail) as
        | string
        | undefined,
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizeSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private buildFallbackSlug(product: any): string {
    const base = this.normalizeSlug(product?.title || 'product') || 'product';
    const suffix = product?._id?.toString()?.slice(-6) || 'item';
    return `${base}-${suffix}`;
  }

  private async generateUniqueSlug(
    title: string,
    excludeProductId?: string,
  ): Promise<string> {
    const base = this.normalizeSlug(title) || 'product';

    let candidate = base;
    let attempt = 0;
    let exists = true;

    while (exists) {
      exists = !!(await this.productModel
        .exists({
          slug: candidate,
          ...(excludeProductId
            ? { _id: { $ne: new Types.ObjectId(excludeProductId) } }
            : {}),
        })
        .exec());

      if (!exists) {
        return candidate;
      }

      attempt += 1;
      candidate = `${base}-${attempt}`;
    }

    return candidate;
  }

  private effectivePriceExpression(): any {
    return {
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
    };
  }

  private toProductCard(product: any): ProductCard {
    return {
      _id: product._id.toString(),
      title: product.title,
      slug: product.slug || this.buildFallbackSlug(product),
      thumbnail: this.toPublicAssetUrl(product.thumbnail) || undefined,
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

  private toProductVendor(vendor: any): ProductVendor {
    return {
      _id: vendor._id.toString(),
      memberNickname: vendor.memberNickname,
      memberFirstName: vendor.memberFirstName,
      memberLastName: vendor.memberLastName,
      memberAvatar: vendor.memberAvatar,
      memberType: vendor.memberType,
    };
  }

  private toProductDetail(product: any, vendor?: any): ProductDetail {
    return {
      _id: product._id.toString(),
      memberId: product.memberId.toString(),
      title: product.title,
      slug: product.slug || this.buildFallbackSlug(product),
      description: product.description,
      categoryIds: (product.categoryIds || []).map((id: any) => id.toString()),
      brand: product.brand,
      sku: product.sku,
      unit: product.unit,
      price: product.price,
      salePrice: product.salePrice,
      stockQty: product.stockQty,
      minOrderQty: product.minOrderQty,
      tags: product.tags || [],
      images: (product.images || []).map((image: string) =>
        this.toPublicAssetUrl(image),
      ),
      thumbnail: this.toPublicAssetUrl(product.thumbnail) || undefined,
      status: product.status,
      isFeatured: !!product.isFeatured,
      featuredRank:
        product.featuredRank === undefined || product.featuredRank === null
          ? undefined
          : Number(product.featuredRank),
      featuredAt: product.featuredAt || undefined,
      views: product.views,
      likes: product.likes,
      meLiked: false,
      meViewed: false,
      ordersCount: product.ordersCount,
      ratingAvg: Number(product.ratingAvg || 0),
      reviewsCount: Number(product.reviewsCount || 0),
      vendor: vendor ? this.toProductVendor(vendor) : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private toProductResponse(product: any): ProductResponse {
    return this.toProductDetail(product);
  }

  private async validateCategoryIds(categoryIds?: string[]): Promise<void> {
    if (!categoryIds || categoryIds.length === 0) {
      return;
    }

    const activeCategoriesCount = await this.categoryModel
      .countDocuments({
        _id: { $in: categoryIds },
        status: CategoryStatus.ACTIVE,
        deletedAt: null,
      })
      .exec();

    if (activeCategoriesCount !== categoryIds.length) {
      throw new BadRequestException('Invalid or inactive categories detected');
    }
  }

  private buildSearchFilter(search?: string): any {
    if (!search) {
      return {};
    }

    return {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ],
    };
  }

  private normalizeCatalogLimit(limit: number): number {
    return Math.min(Math.max(limit || 12, 1), this.maxCatalogLimit);
  }

  private buildCatalogSortStage(sortBy?: ProductSortBy): any {
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

  private popularityScoreExpression(): any {
    return {
      $add: [
        { $multiply: ['$ordersCount', 5] },
        { $multiply: ['$likes', 2] },
        { $multiply: ['$views', 0.2] },
      ],
    };
  }

  private async fetchPopularProducts(limit: number): Promise<any[]> {
    return this.productModel
      .aggregate([
        {
          $match: {
            status: ProductStatus.PUBLISHED,
            deletedAt: null,
          },
        },
        {
          $addFields: {
            popularityScore: this.popularityScoreExpression(),
          },
        },
        { $sort: { popularityScore: -1, createdAt: -1, _id: 1 } },
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
      ])
      .exec();
  }

  public async createProduct(
    memberId: string,
    input: CreateProductInput,
  ): Promise<ProductResponse> {
    try {
      const normalizedInput = this.normalizeMediaInput(input);

      await this.validateCategoryIds(normalizedInput.categoryIds);

      const slug = await this.generateUniqueSlug(normalizedInput.title);

      const newProduct = await this.productModel.create({
        ...normalizedInput,
        slug,
        memberId,
        status: normalizedInput.status ?? ProductStatus.DRAFT,
        deletedAt: null,
      });

      return this.toProductResponse(newProduct);
    } catch (err) {
      console.log('Error, Service.createProduct', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException('SKU already exists for this vendor');
      }
      throw new BadRequestException(err.message || Message.CREATE_FAILED);
    }
  }

  public async updateProduct(
    memberId: string,
    input: UpdateProductInput,
  ): Promise<ProductResponse> {
    try {
      const { productId, ...rawUpdateData } = input;
      const updateData = this.normalizeMediaInput(rawUpdateData);

      const existingProduct = await this.productModel
        .findOne({ _id: productId, memberId, deletedAt: null })
        .exec();

      if (!existingProduct) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      if (updateData.categoryIds) {
        await this.validateCategoryIds(updateData.categoryIds);
      }

      if (updateData.title && updateData.title !== existingProduct.title) {
        updateData['slug'] = await this.generateUniqueSlug(
          updateData.title,
          productId,
        );
      }

      const updatedProduct = await this.productModel
        .findByIdAndUpdate(productId, updateData, { new: true })
        .exec();

      if (!updatedProduct) {
        throw new BadRequestException(Message.UPDATE_FAILED);
      }

      return this.toProductResponse(updatedProduct);
    } catch (err) {
      console.log('Error, Service.updateProduct', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException('SKU already exists for this vendor');
      }
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async removeProduct(
    memberId: string,
    input: RemoveProductInput,
  ): Promise<ProductResponse> {
    try {
      const product = await this.productModel
        .findOne({ _id: input.productId, memberId, deletedAt: null })
        .exec();

      if (!product) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      product.status = ProductStatus.ARCHIVED;
      product.deletedAt = new Date();
      await product.save();

      return this.toProductResponse(product);
    } catch (err) {
      console.log('Error, Service.removeProduct', err.message);
      throw new BadRequestException(err.message || Message.REMOVE_FAILED);
    }
  }

  public async getProducts(
    input: CatalogProductsInquiry,
  ): Promise<CatalogProducts> {
    try {
      if (
        input?.minPrice !== undefined &&
        input?.maxPrice !== undefined &&
        input.minPrice > input.maxPrice
      ) {
        throw new BadRequestException(
          'minPrice cannot be greater than maxPrice',
        );
      }

      const page = input?.page ?? 1;
      const limit = this.normalizeCatalogLimit(input?.limit ?? 12);
      const skip = (page - 1) * limit;

      const baseMatch: any = {
        status: ProductStatus.PUBLISHED,
        deletedAt: null,
      };

      if (input?.search?.trim()) {
        const keyword = input.search.trim();
        baseMatch.$or = [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { tags: { $regex: keyword, $options: 'i' } },
          { brand: { $regex: keyword, $options: 'i' } },
        ];
      }

      if (input?.categoryIds?.length) {
        baseMatch.categoryIds = {
          $in: input.categoryIds.map((id) => new Types.ObjectId(id)),
        };
      }

      if (input?.brand?.trim()) {
        baseMatch.brand = { $regex: input.brand.trim(), $options: 'i' };
      }

      if (input?.inStock === true) {
        baseMatch.stockQty = { $gt: 0 };
      }

      if (input?.inStock === false) {
        baseMatch.stockQty = { $lte: 0 };
      }

      if (input?.minRating !== undefined) {
        baseMatch.ratingAvg = { $gte: input.minRating };
      }

      const effectivePriceExpr = this.effectivePriceExpression();
      const sortStage = this.buildCatalogSortStage(input?.sortBy);

      const priceMatch: any = {};
      if (input?.minPrice !== undefined) {
        priceMatch.$gte = input.minPrice;
      }
      if (input?.maxPrice !== undefined) {
        priceMatch.$lte = input.maxPrice;
      }

      const pipeline: any[] = [
        { $match: baseMatch },
        {
          $addFields: {
            effectivePrice: effectivePriceExpr,
            popularityScore: {
              $add: [
                { $multiply: ['$ordersCount', 5] },
                { $multiply: ['$likes', 2] },
                { $multiply: ['$views', 0.2] },
              ],
            },
          },
        },
      ];

      if (Object.keys(priceMatch).length > 0) {
        pipeline.push({
          $match: {
            effectivePrice: priceMatch,
          },
        });
      }

      pipeline.push(
        {
          $facet: {
            list: [
              { $sort: sortStage },
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
      );

      const [result] = await this.productModel.aggregate(pipeline).exec();

      return {
        list: (result?.list || []).map((product: any) =>
          this.toProductCard(product),
        ),
        metaCounter: { total: result?.total || 0 },
      };
    } catch (err) {
      console.log('Error, Service.getProducts', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getFeaturedProducts(
    input: FeaturedProductsInquiry,
  ): Promise<ProductCard[]> {
    try {
      const limit = this.normalizeCatalogLimit(input?.limit ?? 8);
      const products = await this.productModel
        .aggregate([
          {
            $match: {
              status: ProductStatus.PUBLISHED,
              deletedAt: null,
              isFeatured: true,
            },
          },
          {
            $addFields: {
              featuredRankSort: {
                $ifNull: ['$featuredRank', 2147483647],
              },
            },
          },
          {
            $sort: {
              featuredRankSort: 1,
              featuredAt: -1,
              createdAt: -1,
              _id: 1,
            },
          },
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
        ])
        .exec();

      return products.map((product: any) => this.toProductCard(product));
    } catch (err) {
      console.log('Error, Service.getFeaturedProducts', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getPopularProducts(
    input: PopularProductsInquiry,
  ): Promise<ProductCard[]> {
    try {
      const limit = this.normalizeCatalogLimit(input?.limit ?? 8);
      const products = await this.fetchPopularProducts(limit);
      return products.map((product: any) => this.toProductCard(product));
    } catch (err) {
      console.log('Error, Service.getPopularProducts', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getTrendingProducts(
    input: TrendingProductsInquiry,
  ): Promise<ProductCard[]> {
    try {
      const limit = this.normalizeCatalogLimit(input?.limit ?? 8);
      const windowDays = Math.min(Math.max(input?.windowDays ?? 7, 1), 30);
      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

      const [recentViews, recentLikes, recentOrders] = await Promise.all([
        this.viewModel
          .aggregate([
            {
              $match: {
                viewGroup: ViewGroup.PRODUCT,
                createdAt: { $gte: since },
              },
            },
            { $group: { _id: '$viewRefId', count: { $sum: 1 } } },
          ])
          .exec(),
        this.likeModel
          .aggregate([
            {
              $match: {
                likeGroup: LikeGroup.PRODUCT,
                createdAt: { $gte: since },
              },
            },
            { $group: { _id: '$likeRefId', count: { $sum: 1 } } },
          ])
          .exec(),
        this.orderItemModel
          .aggregate([
            {
              $match: {
                createdAt: { $gte: since },
                status: {
                  $nin: [OrderStatus.CANCELED, OrderStatus.REFUNDED],
                },
              },
            },
            { $group: { _id: '$productId', count: { $sum: '$quantity' } } },
          ])
          .exec(),
      ]);

      const interactionMap = new Map<
        string,
        { views: number; likes: number; orders: number }
      >();

      const ensureBucket = (productId: string) => {
        if (!interactionMap.has(productId)) {
          interactionMap.set(productId, { views: 0, likes: 0, orders: 0 });
        }
      };

      for (const row of recentViews) {
        const productId = row._id?.toString();
        if (!productId) continue;
        ensureBucket(productId);
        interactionMap.get(productId)!.views = Number(row.count || 0);
      }

      for (const row of recentLikes) {
        const productId = row._id?.toString();
        if (!productId) continue;
        ensureBucket(productId);
        interactionMap.get(productId)!.likes = Number(row.count || 0);
      }

      for (const row of recentOrders) {
        const productId = row._id?.toString();
        if (!productId) continue;
        ensureBucket(productId);
        interactionMap.get(productId)!.orders = Number(row.count || 0);
      }

      const candidateIds = Array.from(interactionMap.keys()).map(
        (id) => new Types.ObjectId(id),
      );

      if (candidateIds.length === 0) {
        const fallback = await this.productModel
          .find({
            status: ProductStatus.PUBLISHED,
            deletedAt: null,
          })
          .sort({ createdAt: -1, _id: 1 })
          .limit(limit)
          .select(
            '_id title slug thumbnail price salePrice stockQty status likes views ratingAvg reviewsCount createdAt',
          )
          .lean()
          .exec();

        return fallback.map((product: any) => this.toProductCard(product));
      }

      const candidateProducts = await this.productModel
        .find({
          _id: { $in: candidateIds },
          status: ProductStatus.PUBLISHED,
          deletedAt: null,
        })
        .select(
          '_id title slug thumbnail price salePrice stockQty status likes views ratingAvg reviewsCount createdAt',
        )
        .lean()
        .exec();

      const ranked = candidateProducts
        .map((product: any) => {
          const interaction = interactionMap.get(product._id.toString()) || {
            views: 0,
            likes: 0,
            orders: 0,
          };

          const trendingScore =
            interaction.orders * 8 +
            interaction.likes * 3 +
            interaction.views * 0.5;

          return {
            product,
            trendingScore,
          };
        })
        .sort((a, b) => {
          if (b.trendingScore !== a.trendingScore) {
            return b.trendingScore - a.trendingScore;
          }
          return (
            new Date(b.product.createdAt).getTime() -
            new Date(a.product.createdAt).getTime()
          );
        })
        .slice(0, limit)
        .map((entry) => this.toProductCard(entry.product));

      return ranked;
    } catch (err) {
      console.log('Error, Service.getTrendingProducts', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getRelatedProducts(
    input: RelatedProductsInquiry,
  ): Promise<ProductCard[]> {
    try {
      const sourceProduct = await this.productModel
        .findOne({
          _id: input.productId,
          status: ProductStatus.PUBLISHED,
          deletedAt: null,
        })
        .exec();

      if (!sourceProduct) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const limit = this.normalizeCatalogLimit(input?.limit ?? 8);

      const match: any = {
        _id: { $ne: sourceProduct._id },
        status: ProductStatus.PUBLISHED,
        deletedAt: null,
      };

      if (sourceProduct.categoryIds?.length) {
        match.categoryIds = { $in: sourceProduct.categoryIds };
      } else if (sourceProduct.brand) {
        match.brand = sourceProduct.brand;
      }

      const products = await this.productModel
        .aggregate([
          { $match: match },
          {
            $addFields: {
              overlapCategories: {
                $size: {
                  $setIntersection: [
                    '$categoryIds',
                    sourceProduct.categoryIds || [],
                  ],
                },
              },
              brandBonus: {
                $cond: [{ $eq: ['$brand', sourceProduct.brand || ''] }, 1, 0],
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
            $addFields: {
              relatedScore: {
                $add: [
                  { $multiply: ['$overlapCategories', 10] },
                  { $multiply: ['$brandBonus', 5] },
                  '$popularityScore',
                ],
              },
            },
          },
          { $sort: { relatedScore: -1, createdAt: -1, _id: 1 } },
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
        ])
        .exec();

      return products.map((product: any) => this.toProductCard(product));
    } catch (err) {
      console.log('Error, Service.getRelatedProducts', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async searchSuggestions(
    input: SearchSuggestionsInput,
  ): Promise<SearchSuggestion[]> {
    try {
      const keyword = (input?.keyword || '').trim();

      if (keyword.length < 2) {
        throw new BadRequestException('Keyword must be at least 2 characters');
      }

      const limit = Math.min(
        Math.max(input?.limit ?? this.defaultSuggestionLimit, 1),
        this.maxSuggestionLimit,
      );

      const safeKeyword = this.escapeRegex(keyword);

      const baseMatch = {
        status: ProductStatus.PUBLISHED,
        deletedAt: null,
      };

      const projection = {
        _id: 1,
        title: 1,
        slug: 1,
        thumbnail: 1,
      };

      const picked = new Map<string, SearchSuggestion>();

      const pickFrom = async (criteria: any): Promise<void> => {
        if (picked.size >= limit) {
          return;
        }

        const docs = await this.productModel
          .find({ ...baseMatch, ...criteria }, projection)
          .sort({ createdAt: -1, _id: 1 })
          .limit(limit)
          .exec();

        for (const doc of docs) {
          if (picked.size >= limit) {
            break;
          }

          const id = doc._id.toString();
          if (!picked.has(id)) {
            picked.set(id, {
              _id: id,
              title: doc.title,
              slug: doc.slug || this.buildFallbackSlug(doc),
              thumbnail: doc.thumbnail || null,
            });
          }
        }
      };

      await pickFrom({ title: { $regex: `^${safeKeyword}`, $options: 'i' } });
      await pickFrom({ title: { $regex: safeKeyword, $options: 'i' } });
      await pickFrom({ brand: { $regex: safeKeyword, $options: 'i' } });

      return Array.from(picked.values());
    } catch (err) {
      console.log('Error, Service.searchSuggestions', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getProductById(
    productId: string,
    authMember?: JwtPayload,
  ): Promise<ProductDetail> {
    try {
      const product = await this.productModel
        .findOne({
          _id: productId,
          status: ProductStatus.PUBLISHED,
          deletedAt: null,
        })
        .exec();

      if (!product) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const vendor = await this.memberModel
        .findById(product.memberId)
        .select(
          '_id memberNickname memberFirstName memberLastName memberAvatar memberType',
        )
        .exec();

      const response = this.toProductDetail(product, vendor || null);

      if (authMember?.sub) {
        const [liked, viewed] = await Promise.all([
          this.likeModel
            .exists({
              memberId: authMember.sub,
              likeRefId: product._id,
              likeGroup: LikeGroup.PRODUCT,
            })
            .exec(),
          this.viewModel
            .exists({
              memberId: authMember.sub,
              viewRefId: product._id,
              viewGroup: ViewGroup.PRODUCT,
            })
            .exec(),
        ]);

        response.meLiked = !!liked;
        response.meViewed = !!viewed;
      }

      return response;
    } catch (err) {
      console.log('Error, Service.getProductById', err.message);
      throw new BadRequestException(err.message || Message.NO_DATA_FOUND);
    }
  }

  public async getMyProducts(
    memberId: string,
    input?: MyProductsInquiry,
  ): Promise<MyProductsResponse> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const skip = (page - 1) * limit;

      const filter: any = {
        memberId,
        deletedAt: null,
        ...(input?.status ? { status: input.status } : {}),
        ...this.buildSearchFilter(input?.search),
      };

      const [products, total] = await Promise.all([
        this.productModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productModel.countDocuments(filter).exec(),
      ]);

      return {
        list: products.map((product: any) => this.toProductResponse(product)),
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getMyProducts', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getProductsByAdmin(
    input?: AdminProductsInquiry,
  ): Promise<MyProductsResponse> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter: any = {
        deletedAt: null,
        ...(input?.status ? { status: input.status } : {}),
        ...(input?.memberId ? { memberId: input.memberId } : {}),
        ...this.buildSearchFilter(input?.search),
      };

      const [products, total] = await Promise.all([
        this.productModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productModel.countDocuments(filter).exec(),
      ]);

      return {
        list: products.map((product: any) => this.toProductResponse(product)),
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getProductsByAdmin', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getFeaturedProductsByAdmin(
    input?: AdminProductsInquiry,
  ): Promise<MyProductsResponse> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter: any = {
        deletedAt: null,
        isFeatured: true,
        ...(input?.status ? { status: input.status } : {}),
        ...(input?.memberId ? { memberId: input.memberId } : {}),
        ...this.buildSearchFilter(input?.search),
      };

      const [products, total] = await Promise.all([
        this.productModel
          .find(filter)
          .sort({ featuredRank: 1, featuredAt: -1, createdAt: -1, _id: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productModel.countDocuments(filter).exec(),
      ]);

      return {
        list: products.map((product: any) => this.toProductResponse(product)),
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getFeaturedProductsByAdmin', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getProductByIdByAdmin(
    productId: string,
  ): Promise<ProductResponse> {
    try {
      const product = await this.productModel
        .findOne({ _id: productId, deletedAt: null })
        .exec();

      if (!product) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return this.toProductResponse(product);
    } catch (err) {
      console.log('Error, Service.getProductByIdByAdmin', err.message);
      throw new BadRequestException(err.message || Message.NO_DATA_FOUND);
    }
  }

  public async updateProductStatusByAdmin(
    input: UpdateProductStatusByAdminInput,
  ): Promise<ProductResponse> {
    try {
      const product = await this.productModel
        .findOne({ _id: input.productId, deletedAt: null })
        .exec();

      if (!product) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      product.status = input.status;
      await product.save();

      return this.toProductResponse(product);
    } catch (err) {
      console.log('Error, Service.updateProductStatusByAdmin', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async setProductFeaturedByAdmin(
    input: SetProductFeaturedByAdminInput,
  ): Promise<ProductResponse> {
    try {
      const product = await this.productModel
        .findOne({ _id: input.productId, deletedAt: null })
        .exec();

      if (!product) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      if (input.isFeatured) {
        product.isFeatured = true;
        if (input.featuredRank !== undefined) {
          product.featuredRank = input.featuredRank;
        }
        product.featuredAt = new Date();
      } else {
        product.isFeatured = false;
        product.featuredRank = null;
        product.featuredAt = null;
      }

      await product.save();

      return this.toProductResponse(product);
    } catch (err) {
      console.log('Error, Service.setProductFeaturedByAdmin', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async removeProductByAdmin(
    input: RemoveProductInput,
  ): Promise<ProductResponse> {
    try {
      const product = await this.productModel
        .findOne({ _id: input.productId, deletedAt: null })
        .exec();

      if (!product) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      product.status = ProductStatus.ARCHIVED;
      product.deletedAt = new Date();
      await product.save();

      return this.toProductResponse(product);
    } catch (err) {
      console.log('Error, Service.removeProductByAdmin', err.message);
      throw new BadRequestException(err.message || Message.REMOVE_FAILED);
    }
  }
}
