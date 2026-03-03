import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import {
  AdminProductsInquiry,
  CatalogProducts,
  CatalogProductsInquiry,
  CreateProductInput,
  FeaturedProductsInquiry,
  MyProductsInquiry,
  MyProductsResponse,
  ProductCard,
  ProductDetail,
  ProductResponse,
  RelatedProductsInquiry,
  RemoveProductInput,
  SearchSuggestion,
  SearchSuggestionsInput,
  UpdateProductInput,
  UpdateProductStatusByAdminInput,
} from '../../libs/dto/product/product';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enums';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { JwtPayload } from '../../libs/types/common';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Mutation(() => ProductResponse)
  public async createProduct(
    @Args('input') input: CreateProductInput,
    @AuthMember('sub') memberId: string,
  ): Promise<ProductResponse> {
    console.log('Mutation: createProduct');
    return await this.productService.createProduct(memberId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Mutation(() => ProductResponse)
  public async updateProduct(
    @Args('input') input: UpdateProductInput,
    @AuthMember('sub') memberId: string,
  ): Promise<ProductResponse> {
    console.log('Mutation: updateProduct');
    return await this.productService.updateProduct(memberId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Mutation(() => ProductResponse)
  public async removeProduct(
    @Args('input') input: RemoveProductInput,
    @AuthMember('sub') memberId: string,
  ): Promise<ProductResponse> {
    console.log('Mutation: removeProduct');
    return await this.productService.removeProduct(memberId, input);
  }

  @Query(() => CatalogProducts)
  public async getProducts(
    @Args('input') input: CatalogProductsInquiry,
  ): Promise<CatalogProducts> {
    console.log('Query: getProducts');
    return await this.productService.getProducts(input);
  }

  @Query(() => [ProductCard])
  public async getFeaturedProducts(
    @Args('input') input: FeaturedProductsInquiry,
  ): Promise<ProductCard[]> {
    console.log('Query: getFeaturedProducts');
    return await this.productService.getFeaturedProducts(input);
  }

  @Query(() => [ProductCard])
  public async getRelatedProducts(
    @Args('input') input: RelatedProductsInquiry,
  ): Promise<ProductCard[]> {
    console.log('Query: getRelatedProducts');
    return await this.productService.getRelatedProducts(input);
  }

  @Query(() => [SearchSuggestion])
  public async searchSuggestions(
    @Args('input') input: SearchSuggestionsInput,
  ): Promise<SearchSuggestion[]> {
    console.log('Query: searchSuggestions');
    return await this.productService.searchSuggestions(input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => ProductDetail)
  public async getProductById(
    @Args('productId') productId: string,
    @AuthMember() authMember?: JwtPayload,
  ): Promise<ProductDetail> {
    console.log('Query: getProductById');
    return await this.productService.getProductById(productId, authMember);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Query(() => MyProductsResponse)
  public async getMyProducts(
    @AuthMember('sub') memberId: string,
    @Args('input', { nullable: true }) input?: MyProductsInquiry,
  ): Promise<MyProductsResponse> {
    console.log('Query: getMyProducts');
    return await this.productService.getMyProducts(memberId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => MyProductsResponse)
  public async getProductsByAdmin(
    @Args('input', { nullable: true }) input?: AdminProductsInquiry,
  ): Promise<MyProductsResponse> {
    console.log('Query: getProductsByAdmin');
    return await this.productService.getProductsByAdmin(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => ProductResponse)
  public async getProductByIdByAdmin(
    @Args('productId') productId: string,
  ): Promise<ProductResponse> {
    console.log('Query: getProductByIdByAdmin');
    return await this.productService.getProductByIdByAdmin(productId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => ProductResponse)
  public async updateProductStatusByAdmin(
    @Args('input') input: UpdateProductStatusByAdminInput,
  ): Promise<ProductResponse> {
    console.log('Mutation: updateProductStatusByAdmin');
    return await this.productService.updateProductStatusByAdmin(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => ProductResponse)
  public async removeProductByAdmin(
    @Args('input') input: RemoveProductInput,
  ): Promise<ProductResponse> {
    console.log('Mutation: removeProductByAdmin');
    return await this.productService.removeProductByAdmin(input);
  }

  // END OF CLASS
}
