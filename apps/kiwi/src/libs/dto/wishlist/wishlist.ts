import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  Min,
} from 'class-validator';
import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { ProductStatus } from '../../enums/product.enum';

@InputType()
export class GetMyWishlistInput {
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
}

@ObjectType()
export class MetaCounterDTO {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => Boolean)
  hasPrevPage: boolean;
}

@ObjectType()
export class WishlistProductDTO {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  slug: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  thumbnail?: string;

  @Field(() => Number)
  price: number;

  @Field(() => Number, { nullable: true })
  salePrice?: number;

  @Field(() => ProductStatus)
  status: ProductStatus;
}

@ObjectType()
export class WishlistItemDTO {
  @Field(() => ID)
  _id: string;

  @Field(() => ID)
  memberId: string;

  @Field(() => ID)
  productId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => WishlistProductDTO)
  product: WishlistProductDTO;
}

@ObjectType()
export class GetMyWishlistOutput {
  @Field(() => [WishlistItemDTO])
  list: WishlistItemDTO[];

  @Field(() => MetaCounterDTO)
  metaCounter: MetaCounterDTO;
}

@InputType()
export class AddToWishlistInput {
  @Field(() => ID)
  @IsMongoId()
  productId: string;
}

@ObjectType()
export class AddToWishlistOutput {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => WishlistItemDTO, { nullable: true })
  wishlistItem?: WishlistItemDTO;
}

@InputType()
export class RemoveFromWishlistInput {
  @Field(() => ID)
  @IsMongoId()
  productId: string;
}

@ObjectType()
export class RemoveFromWishlistOutput {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => ID, { nullable: true })
  removedProductId?: string;
}

@InputType()
export class GetWishlistStatusInput {
  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsMongoId({ each: true })
  productIds: string[];
}

@ObjectType()
export class WishlistStatusDTO {
  @Field(() => ID)
  productId: string;

  @Field(() => Boolean)
  isWishlisted: boolean;
}

@ObjectType()
export class GetWishlistStatusOutput {
  @Field(() => [WishlistStatusDTO])
  list: WishlistStatusDTO[];
}
