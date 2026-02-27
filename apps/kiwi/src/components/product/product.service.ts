import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AdminProductsInquiry,
  CreateProductInput,
  MyProductsInquiry,
  MyProductsResponse,
  ProductResponse,
  ProductsInquiry,
  RemoveProductInput,
  UpdateProductInput,
  UpdateProductStatusByAdminInput,
} from '../../libs/dto/product/product';
import { ProductStatus } from '../../libs/enums/product.enum';
import { CategoryStatus } from '../../libs/enums/product-category.enum';
import { MemberType } from '../../libs/enums/member.enums';
import { Message } from '../../libs/enums/common.enum';
import type { JwtPayload } from '../../libs/types/common';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel('Product')
    private readonly productModel: Model<any>,
    @InjectModel('Category')
    private readonly categoryModel: Model<any>,
  ) {}

  private toProductResponse(product: any): ProductResponse {
    return {
      _id: product._id.toString(),
      memberId: product.memberId.toString(),
      title: product.title,
      description: product.description,
      categoryIds: product.categoryIds.map((id: any) => id.toString()),
      brand: product.brand,
      sku: product.sku,
      unit: product.unit,
      price: product.price,
      salePrice: product.salePrice,
      stockQty: product.stockQty,
      minOrderQty: product.minOrderQty,
      tags: product.tags,
      images: product.images,
      thumbnail: product.thumbnail,
      status: product.status,
      views: product.views,
      likes: product.likes,
      ordersCount: product.ordersCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
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

  public async createProduct(
    memberId: string,
    input: CreateProductInput,
  ): Promise<ProductResponse> {
    try {
      await this.validateCategoryIds(input.categoryIds);

      const newProduct = await this.productModel.create({
        ...input,
        memberId,
        status: input.status ?? ProductStatus.DRAFT,
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
      const { productId, ...updateData } = input;

      const existingProduct = await this.productModel
        .findOne({ _id: productId, memberId, deletedAt: null })
        .exec();

      if (!existingProduct) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      if (updateData.categoryIds) {
        await this.validateCategoryIds(updateData.categoryIds);
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
    input?: ProductsInquiry,
  ): Promise<MyProductsResponse> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 12;
      const skip = (page - 1) * limit;

      const filter: any = {
        status: ProductStatus.PUBLISHED,
        deletedAt: null,
        ...(input?.categoryId ? { categoryIds: input.categoryId } : {}),
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
      console.log('Error, Service.getProducts', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getProductById(
    productId: string,
    authMember?: JwtPayload,
  ): Promise<ProductResponse> {
    try {
      const product = await this.productModel
        .findOne({
          _id: productId,
          deletedAt: null,
        })
        .exec();

      if (!product) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const isPublished = product.status === ProductStatus.PUBLISHED;
      const isOwner = authMember?.sub === product.memberId.toString();
      const isAdmin = authMember?.memberType === MemberType.ADMIN;

      if (!isPublished && !isOwner && !isAdmin) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return this.toProductResponse(product);
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

  // END OF CLASS
}
