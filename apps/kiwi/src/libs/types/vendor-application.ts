import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { VendorApplicationStatus } from '../enums/member.enums';
import { Document } from 'mongoose';
import { MetaCounter } from '../dto/product/product';

export interface VendorApplicationDocument extends Document {
  memberId: string;
  storeName: string;
  description: string;
  businessLicenseUrl: string;
  status: VendorApplicationStatus;
  rejectionReason?: string | null;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@ObjectType()
export class VendorApplication {
  @Field(() => ID)
  _id: string;

  @Field(() => ID)
  memberId: string;

  @Field()
  storeName: string;

  @Field()
  description: string;

  @Field()
  businessLicenseUrl: string;

  @Field(() => VendorApplicationStatus)
  status: VendorApplicationStatus;

  @Field(() => String, { nullable: true })
  rejectionReason?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@InputType()
export class ApplyVendorInput {
  @Field()
  storeName: string;

  @Field()
  description: string;

  @Field()
  businessLicenseUrl: string;
}

@InputType()
export class ReviewVendorApplicationInput {
  @Field(() => ID)
  applicationId: string;

  @Field(() => VendorApplicationStatus)
  status: VendorApplicationStatus;

  @Field({ nullable: true })
  rejectionReason?: string;
}

@InputType()
export class VendorApplicationsInquiryInput {
  @Field(() => Number)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Number)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @Field(() => VendorApplicationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(VendorApplicationStatus)
  status?: VendorApplicationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

@ObjectType()
export class VendorApplicationsByAdmin {
  @Field(() => [VendorApplication])
  list: VendorApplication[];

  @Field(() => MetaCounter)
  metaCounter: MetaCounter;
}
