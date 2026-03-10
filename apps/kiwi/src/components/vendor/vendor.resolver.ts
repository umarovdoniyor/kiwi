import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VendorService } from './vendor.service';
import {
  UpdateMyVendorProfileInput,
  VendorDashboardSummary,
  VendorDetail,
  VendorProfile,
  VendorProductsInquiry,
  VendorsInquiry,
  VendorsPayload,
} from '../../libs/dto/vendor/vendor';
import { ProductPayload } from '../../libs/dto/product/product';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enums';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import {
  VendorProductReviewsInquiryInput,
  VendorProductReviewsPage,
} from '../../libs/dto/product-review/product-review';

@Resolver()
export class VendorResolver {
  constructor(private readonly vendorService: VendorService) {}

  @Query(() => VendorsPayload)
  public async getVendors(
    @Args('input') input: VendorsInquiry,
  ): Promise<VendorsPayload> {
    console.log('Query: getVendors');
    return await this.vendorService.getVendors(input);
  }

  @Query(() => VendorDetail, { nullable: true })
  public async getVendorBySlug(
    @Args('slug') slug: string,
  ): Promise<VendorDetail | null> {
    console.log('Query: getVendorBySlug');
    return await this.vendorService.getVendorBySlug(slug);
  }

  @Query(() => ProductPayload)
  public async getVendorProducts(
    @Args('vendorId') vendorId: string,
    @Args('input') input: VendorProductsInquiry,
  ): Promise<ProductPayload> {
    console.log('Query: getVendorProducts');
    return await this.vendorService.getVendorProducts(vendorId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Query(() => VendorProfile)
  public async getMyVendorProfile(
    @AuthMember('sub') vendorId: string,
  ): Promise<VendorProfile> {
    console.log('Query: getMyVendorProfile');
    return await this.vendorService.getMyVendorProfile(vendorId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Mutation(() => VendorProfile)
  public async updateMyVendorProfile(
    @AuthMember('sub') vendorId: string,
    @Args('input') input: UpdateMyVendorProfileInput,
  ): Promise<VendorProfile> {
    console.log('Mutation: updateMyVendorProfile');
    return await this.vendorService.updateMyVendorProfile(vendorId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Query(() => VendorDashboardSummary)
  public async getVendorDashboardSummary(
    @AuthMember('sub') vendorId: string,
  ): Promise<VendorDashboardSummary> {
    console.log('Query: getVendorDashboardSummary');
    return await this.vendorService.getVendorDashboardSummary(vendorId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Query(() => VendorProductReviewsPage)
  public async getVendorProductReviews(
    @AuthMember('sub') vendorId: string,
    @Args('input') input: VendorProductReviewsInquiryInput,
  ): Promise<VendorProductReviewsPage> {
    console.log('Query: getVendorProductReviews');
    return await this.vendorService.getVendorProductReviews(vendorId, input);
  }
}
