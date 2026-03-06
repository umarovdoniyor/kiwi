import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  ProductReviewSortBy,
  ProductReviewStatus,
} from '../../enums/product-review.enum';
import { MetaCounter } from '../product/product';

@InputType()
export class ProductReviewsInquiry {
  @Field(() => String)
  @IsMongoId()
  productId: string;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number;

  @Field(() => ProductReviewSortBy, { nullable: true })
  @IsOptional()
  @IsEnum(ProductReviewSortBy)
  sortBy?: ProductReviewSortBy;
}

@InputType()
export class CreateProductReviewInput {
  @Field(() => String)
  @IsMongoId()
  productId: string;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  comment?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  images?: string[];
}

@InputType()
export class UpdateProductReviewInput {
  @Field(() => String)
  @IsMongoId()
  reviewId: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  comment?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  images?: string[];
}

@InputType()
export class ReviewsByAdminInquiry {
  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field(() => ProductReviewStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductReviewStatus)
  status?: ProductReviewStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

@InputType()
export class UpdateReviewStatusByAdminInput {
  @Field(() => String)
  @IsMongoId()
  reviewId: string;

  @Field(() => ProductReviewStatus)
  @IsEnum(ProductReviewStatus)
  status: ProductReviewStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@ObjectType()
export class ProductReviewMember {
  @Field(() => String)
  _id: string;

  @Field(() => String, { nullable: true })
  memberNickname?: string;

  @Field(() => String, { nullable: true })
  memberFirstName?: string;

  @Field(() => String, { nullable: true })
  memberLastName?: string;

  @Field(() => String, { nullable: true })
  memberAvatar?: string;
}

@ObjectType()
export class ProductReview {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  productId: string;

  @Field(() => String)
  memberId: string;

  @Field(() => String, { nullable: true })
  orderId?: string;

  @Field(() => Int)
  rating: number;

  @Field(() => String, { nullable: true })
  comment?: string;

  @Field(() => [String])
  images: string[];

  @Field(() => ProductReviewStatus)
  status: ProductReviewStatus;

  @Field(() => String, { nullable: true })
  moderationReason?: string;

  @Field(() => String, { nullable: true })
  moderatedBy?: string;

  @Field(() => Date, { nullable: true })
  moderatedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => ProductReviewMember, { nullable: true })
  member?: ProductReviewMember;
}

@ObjectType()
export class ProductReviewSummary {
  @Field(() => Number)
  ratingAvg: number;

  @Field(() => Int)
  reviewsCount: number;

  @Field(() => Int)
  rating1Count: number;

  @Field(() => Int)
  rating2Count: number;

  @Field(() => Int)
  rating3Count: number;

  @Field(() => Int)
  rating4Count: number;

  @Field(() => Int)
  rating5Count: number;
}

@ObjectType()
export class ProductReviewsPayload {
  @Field(() => [ProductReview])
  list: ProductReview[];

  @Field(() => MetaCounter)
  metaCounter: MetaCounter;

  @Field(() => ProductReviewSummary)
  summary: ProductReviewSummary;
}
