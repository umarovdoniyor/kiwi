import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import {
  CategoriesResponse,
  CategoryInquiry,
  CategoryResponse,
  CreateCategoryInput,
  RemoveCategoryInput,
  UpdateCategoryInput,
} from '../../libs/dto/product-category/product-category';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enums';

@Resolver()
export class ProductCategoryResolver {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => CategoryResponse)
  public async createCategory(
    @Args('input') input: CreateCategoryInput,
  ): Promise<CategoryResponse> {
    console.log('Mutation: createCategory');
    return await this.productCategoryService.createCategory(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => CategoryResponse)
  public async updateCategory(
    @Args('input') input: UpdateCategoryInput,
  ): Promise<CategoryResponse> {
    console.log('Mutation: updateCategory');
    return await this.productCategoryService.updateCategory(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => CategoryResponse)
  public async removeCategory(
    @Args('input') input: RemoveCategoryInput,
  ): Promise<CategoryResponse> {
    console.log('Mutation: removeCategory');
    return await this.productCategoryService.removeCategory(input);
  }

  @Query(() => CategoriesResponse)
  public async getCategories(
    @Args('input', { nullable: true }) input?: CategoryInquiry,
  ): Promise<CategoriesResponse> {
    console.log('Query: getCategories');
    return await this.productCategoryService.getCategories(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => CategoriesResponse)
  public async getCategoriesByAdmin(
    @Args('input', { nullable: true }) input?: CategoryInquiry,
  ): Promise<CategoriesResponse> {
    console.log('Query: getCategoriesByAdmin');
    return await this.productCategoryService.getCategoriesByAdmin(input);
  }

  @Query(() => CategoryResponse)
  public async getCategoryById(
    @Args('categoryId') categoryId: string,
  ): Promise<CategoryResponse> {
    console.log('Query: getCategoryById');
    return await this.productCategoryService.getCategoryById(categoryId);
  }

  @Query(() => CategoryResponse)
  public async getCategoryBySlug(
    @Args('slug') slug: string,
  ): Promise<CategoryResponse> {
    console.log('Query: getCategoryBySlug');
    return await this.productCategoryService.getCategoryBySlug(slug);
  }
}
