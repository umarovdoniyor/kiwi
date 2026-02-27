// product.dto.ts
import {
  Field,
  ID,
  InputType,
  Int,
  ObjectType,
  PartialType,
} from '@nestjs/graphql';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus, ProductUnit } from '../../enums/product.enum';

@InputType()
export class CreateProductInput {
  @Field(() => String)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @Field(() => String)
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  categoryIds: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @Field(() => ProductUnit)
  @IsEnum(ProductUnit)
  unit: ProductUnit;

  @Field(() => Number)
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  price: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minOrderQty?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  images: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  thumbnail?: string;

  @Field(() => ProductStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field(() => String)
  @IsMongoId()
  productId: string;
}

@InputType()
export class RemoveProductInput {
  @Field(() => String)
  @IsMongoId()
  productId: string;
}

@InputType()
export class ProductsInquiry {
  @Field(() => Int, { defaultValue: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;
}

@InputType()
export class MyProductsInquiry {
  @Field(() => Int, { defaultValue: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @Field(() => ProductStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

@InputType()
export class AdminProductsInquiry extends MyProductsInquiry {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsMongoId()
  memberId?: string;
}

@InputType()
export class UpdateProductStatusByAdminInput {
  @Field(() => String)
  @IsMongoId()
  productId: string;

  @Field(() => ProductStatus)
  @IsEnum(ProductStatus)
  status: ProductStatus;
}

@ObjectType()
export class ProductResponse {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  memberId: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  description: string;

  @Field(() => [String])
  categoryIds: string[];

  @Field(() => String, { nullable: true })
  brand?: string;

  @Field(() => String, { nullable: true })
  sku?: string;

  @Field(() => ProductUnit)
  unit: ProductUnit;

  @Field(() => Number)
  price: number;

  @Field(() => Number, { nullable: true })
  salePrice?: number;

  @Field(() => Int)
  stockQty: number;

  @Field(() => Int)
  minOrderQty: number;

  @Field(() => [String])
  tags: string[];

  @Field(() => [String])
  images: string[];

  @Field(() => String)
  thumbnail: string;

  @Field(() => ProductStatus)
  status: ProductStatus;

  @Field(() => Int)
  views: number;

  @Field(() => Int)
  likes: number;

  @Field(() => Int)
  ordersCount: number;

  @Field(() => Boolean)
  meLiked: boolean;

  @Field(() => Boolean)
  meViewed: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class MetaCounter {
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class MyProductsResponse {
  @Field(() => [ProductResponse])
  list: ProductResponse[];

  @Field(() => MetaCounter)
  metaCounter: MetaCounter;
}
