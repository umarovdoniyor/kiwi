import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enums';
import {
  CreateProductReviewInput,
  ProductReview,
  ProductReviewsInquiry,
  ProductReviewsPayload,
  ReviewsByAdminInquiry,
  UpdateProductReviewInput,
  UpdateReviewStatusByAdminInput,
} from '../../libs/dto/product-review/product-review';
import { ProductReviewService } from './product-review.service';

@Resolver()
export class ProductReviewResolver {
  constructor(private readonly productReviewService: ProductReviewService) {}

  @Query(() => ProductReviewsPayload)
  public async getProductReviews(
    @Args('input') input: ProductReviewsInquiry,
  ): Promise<ProductReviewsPayload> {
    console.log('Query: getProductReviews');
    return await this.productReviewService.getProductReviews(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => ProductReview, { nullable: true })
  public async getMyProductReview(
    @AuthMember('sub') memberId: string,
    @Args('productId') productId: string,
  ): Promise<ProductReview | null> {
    console.log('Query: getMyProductReview');
    return await this.productReviewService.getMyProductReview(
      memberId,
      productId,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => ProductReviewsPayload)
  public async getReviewsByAdmin(
    @Args('input') input: ReviewsByAdminInquiry,
  ): Promise<ProductReviewsPayload> {
    console.log('Query: getReviewsByAdmin');
    return await this.productReviewService.getReviewsByAdmin(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => ProductReview)
  public async createProductReview(
    @AuthMember('sub') memberId: string,
    @Args('input') input: CreateProductReviewInput,
  ): Promise<ProductReview> {
    console.log('Mutation: createProductReview');
    return await this.productReviewService.createProductReview(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => ProductReview)
  public async updateProductReview(
    @AuthMember('sub') memberId: string,
    @Args('input') input: UpdateProductReviewInput,
  ): Promise<ProductReview> {
    console.log('Mutation: updateProductReview');
    return await this.productReviewService.updateProductReview(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Boolean)
  public async removeProductReview(
    @AuthMember('sub') memberId: string,
    @Args('reviewId') reviewId: string,
  ): Promise<boolean> {
    console.log('Mutation: removeProductReview');
    return await this.productReviewService.removeProductReview(
      memberId,
      reviewId,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => ProductReview)
  public async updateReviewStatusByAdmin(
    @AuthMember('sub') adminId: string,
    @Args('input') input: UpdateReviewStatusByAdminInput,
  ): Promise<ProductReview> {
    console.log('Mutation: updateReviewStatusByAdmin');
    return await this.productReviewService.updateReviewStatusByAdmin(
      adminId,
      input,
    );
  }
}
