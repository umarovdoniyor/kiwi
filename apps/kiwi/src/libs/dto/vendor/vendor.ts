import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductSortBy } from '../../enums/product.enum';
import { VendorSortBy, VendorStatus } from '../../enums/vendor.enum';
import { MetaCounter, ProductPayload } from '../product/product';

@InputType()
export class VendorsInquiry {
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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @Field(() => VendorStatus, { nullable: true })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @Field(() => VendorSortBy, { nullable: true })
  @IsOptional()
  @IsEnum(VendorSortBy)
  sortBy?: VendorSortBy;
}

@InputType()
export class VendorProductsInquiry {
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

  @Field(() => ProductSortBy, { nullable: true })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy;
}

@ObjectType()
export class VendorSocialLinks {
  @Field(() => String, { nullable: true })
  facebook?: string;

  @Field(() => String, { nullable: true })
  youtube?: string;

  @Field(() => String, { nullable: true })
  twitter?: string;

  @Field(() => String, { nullable: true })
  instagram?: string;
}

@ObjectType()
export class VendorSummary {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  slug: string;

  @Field(() => String)
  storeName: string;

  @Field(() => String, { nullable: true })
  memberPhone?: string;

  @Field(() => String, { nullable: true })
  memberAddress?: string;

  @Field(() => String, { nullable: true })
  memberImage?: string;

  @Field(() => String, { nullable: true })
  coverImage?: string;

  @Field(() => Boolean)
  verified: boolean;

  @Field(() => VendorStatus)
  status: VendorStatus;

  @Field(() => VendorSocialLinks, { nullable: true })
  socialLinks?: VendorSocialLinks;

  @Field(() => Int)
  productsCount: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class VendorsPayload {
  @Field(() => [VendorSummary])
  list: VendorSummary[];

  @Field(() => MetaCounter)
  metaCounter: MetaCounter;
}

@ObjectType()
export class VendorDetail extends VendorSummary {
  @Field(() => String, { nullable: true })
  storeDescription?: string;

  @Field(() => String, { nullable: true })
  memberEmail?: string;
}

export type VendorProductsPayload = ProductPayload;

@InputType()
export class VendorProductsQueryInput {
  @Field(() => String)
  @IsMongoId()
  vendorId: string;

  @Field(() => VendorProductsInquiry)
  input: VendorProductsInquiry;
}
