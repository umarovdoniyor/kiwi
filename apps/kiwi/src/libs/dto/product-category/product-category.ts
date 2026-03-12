// category.dto.ts
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  Field,
  ID,
  InputType,
  Int,
  ObjectType,
  PartialType,
} from '@nestjs/graphql';
import { CategoryStatus } from '../../enums/product-category.enum';

@InputType()
export class CreateCategoryInput {
  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  icon?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  image?: string;

  @Field(() => CategoryStatus, { nullable: true })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}

@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
  @Field(() => String)
  @IsMongoId()
  categoryId: string;
}

@InputType()
export class RemoveCategoryInput {
  @Field(() => String)
  @IsMongoId()
  categoryId: string;
}

@InputType()
export class CategoryInquiry {
  @Field(() => Int, { defaultValue: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @Field(() => CategoryStatus, { nullable: true })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}

@ObjectType()
export class CategoryResponse {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  icon?: string;

  @Field(() => String, { nullable: true })
  image?: string;

  @Field(() => CategoryStatus)
  status: CategoryStatus;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => String, { nullable: true })
  parentId?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class CategoryMetaCounter {
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class CategoriesResponse {
  @Field(() => [CategoryResponse])
  list: CategoryResponse[];

  @Field(() => CategoryMetaCounter)
  metaCounter: CategoryMetaCounter;
}

@ObjectType()
export class CategoryTreeNode {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  icon?: string;

  @Field(() => String, { nullable: true })
  image?: string;

  @Field(() => CategoryStatus)
  status: CategoryStatus;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => String, { nullable: true })
  parentId?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [CategoryTreeNode])
  children: CategoryTreeNode[];
}
