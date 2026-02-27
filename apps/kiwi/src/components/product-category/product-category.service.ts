import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CategoriesResponse,
  CategoryInquiry,
  CategoryResponse,
  CreateCategoryInput,
  RemoveCategoryInput,
  UpdateCategoryInput,
} from '../../libs/dto/product-category/product-category';
import { CategoryStatus } from '../../libs/enums/product-category.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectModel('Category')
    private readonly categoryModel: Model<any>,
  ) {}

  private toCategoryResponse(category: any): CategoryResponse {
    return {
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      image: category.image,
      status: category.status,
      sortOrder: category.sortOrder,
      parentId: category.parentId ? category.parentId.toString() : null,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  public async createCategory(
    input: CreateCategoryInput,
  ): Promise<CategoryResponse> {
    try {
      if (input.parentId) {
        const parentExists = await this.categoryModel
          .exists({ _id: input.parentId, deletedAt: null })
          .exec();
        if (!parentExists) {
          throw new BadRequestException(Message.NO_DATA_FOUND);
        }
      }

      const newCategory = await this.categoryModel.create({
        ...input,
        slug: input.slug.trim().toLowerCase(),
        deletedAt: null,
      });

      return this.toCategoryResponse(newCategory);
    } catch (err) {
      console.log('Error, Service.createCategory', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException('Slug already exists');
      }
      throw new BadRequestException(err.message || Message.CREATE_FAILED);
    }
  }

  public async updateCategory(
    input: UpdateCategoryInput,
  ): Promise<CategoryResponse> {
    try {
      const { categoryId, ...updateData } = input;

      const existingCategory = await this.categoryModel
        .findOne({ _id: categoryId, deletedAt: null })
        .exec();
      if (!existingCategory) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      if (updateData.parentId) {
        if (updateData.parentId === categoryId) {
          throw new BadRequestException(Message.BAD_REQUEST);
        }

        const parentExists = await this.categoryModel
          .exists({ _id: updateData.parentId, deletedAt: null })
          .exec();
        if (!parentExists) {
          throw new BadRequestException(Message.NO_DATA_FOUND);
        }
      }

      if (updateData.slug) {
        updateData.slug = updateData.slug.trim().toLowerCase();
      }

      const updatedCategory = await this.categoryModel
        .findByIdAndUpdate(
          categoryId,
          {
            ...updateData,
            ...(updateData.parentId === undefined
              ? {}
              : { parentId: updateData.parentId }),
          },
          { new: true },
        )
        .exec();

      if (!updatedCategory) {
        throw new BadRequestException(Message.UPDATE_FAILED);
      }

      return this.toCategoryResponse(updatedCategory);
    } catch (err) {
      console.log('Error, Service.updateCategory', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException('Slug already exists');
      }
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async removeCategory(
    input: RemoveCategoryInput,
  ): Promise<CategoryResponse> {
    try {
      const category = await this.categoryModel
        .findOne({ _id: input.categoryId, deletedAt: null })
        .exec();

      if (!category) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      category.status = CategoryStatus.INACTIVE;
      category.deletedAt = new Date();
      await category.save();

      return this.toCategoryResponse(category);
    } catch (err) {
      console.log('Error, Service.removeCategory', err.message);
      throw new BadRequestException(err.message || Message.REMOVE_FAILED);
    }
  }

  public async getCategories(
    input?: CategoryInquiry,
  ): Promise<CategoriesResponse> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter: any = {
        status: CategoryStatus.ACTIVE,
        deletedAt: null,
      };

      if (input?.search) {
        filter.$or = [
          { name: { $regex: input.search, $options: 'i' } },
          { slug: { $regex: input.search, $options: 'i' } },
        ];
      }

      if (input?.parentId) {
        filter.parentId = input.parentId;
      }

      const [categories, total] = await Promise.all([
        this.categoryModel
          .find(filter)
          .sort({ sortOrder: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.categoryModel.countDocuments(filter).exec(),
      ]);

      return {
        list: categories.map((category) => this.toCategoryResponse(category)),
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getCategories', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getCategoriesByAdmin(
    input?: CategoryInquiry,
  ): Promise<CategoriesResponse> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter: any = { deletedAt: null };

      if (input?.status) {
        filter.status = input.status;
      }

      if (input?.search) {
        filter.$or = [
          { name: { $regex: input.search, $options: 'i' } },
          { slug: { $regex: input.search, $options: 'i' } },
        ];
      }

      if (input?.parentId) {
        filter.parentId = input.parentId;
      }

      const [categories, total] = await Promise.all([
        this.categoryModel
          .find(filter)
          .sort({ sortOrder: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.categoryModel.countDocuments(filter).exec(),
      ]);

      return {
        list: categories.map((category) => this.toCategoryResponse(category)),
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getCategoriesByAdmin', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getCategoryById(categoryId: string): Promise<CategoryResponse> {
    try {
      const category = await this.categoryModel
        .findOne({
          _id: categoryId,
          status: CategoryStatus.ACTIVE,
          deletedAt: null,
        })
        .exec();

      if (!category) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return this.toCategoryResponse(category);
    } catch (err) {
      console.log('Error, Service.getCategoryById', err.message);
      throw new BadRequestException(err.message || Message.NO_DATA_FOUND);
    }
  }

  public async getCategoryBySlug(slug: string): Promise<CategoryResponse> {
    try {
      const category = await this.categoryModel
        .findOne({
          slug: slug.trim().toLowerCase(),
          status: CategoryStatus.ACTIVE,
          deletedAt: null,
        })
        .exec();

      if (!category) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return this.toCategoryResponse(category);
    } catch (err) {
      console.log('Error, Service.getCategoryBySlug', err.message);
      throw new BadRequestException(err.message || Message.NO_DATA_FOUND);
    }
  }
}
