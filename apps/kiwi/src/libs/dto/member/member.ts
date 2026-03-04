import { ObjectType, Field, ID } from '@nestjs/graphql';
import { InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MemberStatus, MemberType } from '../../enums/member.enums';
import { MetaCounter } from '../product/product';

@ObjectType()
export class VendorProfileResponse {
  @Field()
  storeName: string;

  @Field()
  storeDescription: string;

  @Field()
  businessLicense: string;

  @Field({ nullable: true })
  taxId?: string;
}

@ObjectType()
export class MemberResponse {
  @Field(() => ID)
  _id: string;

  @Field()
  memberEmail: string;

  @Field({ nullable: true })
  memberPhone?: string;

  @Field()
  memberNickname: string;

  @Field()
  memberFirstName: string;

  @Field()
  memberLastName: string;

  memberPassword?: string; // Not exposed in GraphQL

  @Field({ nullable: true })
  memberAvatar?: string;

  @Field(() => MemberType)
  memberType: MemberType;

  @Field(() => MemberStatus)
  memberStatus: MemberStatus;

  @Field({ nullable: true })
  memberAddress?: string;

  @Field({ nullable: true })
  vendorProfile?: VendorProfileResponse;

  @Field()
  isEmailVerified: boolean;

  @Field()
  isPhoneVerified: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class MemberAuthResponse {
  @Field(() => MemberResponse)
  member: MemberResponse;

  @Field()
  accessToken: string;
}

@ObjectType()
export class MemberByAdmin {
  @Field(() => ID)
  _id: string;

  @Field({ nullable: true })
  memberEmail?: string;

  @Field({ nullable: true })
  memberPhone?: string;

  @Field({ nullable: true })
  memberNickname?: string;

  @Field({ nullable: true })
  memberFirstName?: string;

  @Field({ nullable: true })
  memberLastName?: string;

  @Field({ nullable: true })
  memberAvatar?: string;

  @Field(() => MemberType)
  memberType: MemberType;

  @Field(() => MemberStatus)
  memberStatus: MemberStatus;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class MembersByAdmin {
  @Field(() => [MemberByAdmin])
  list: MemberByAdmin[];

  @Field(() => MetaCounter)
  metaCounter: MetaCounter;
}

@InputType()
export class MembersInquiryByAdminInput {
  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @Field(() => MemberStatus, { nullable: true })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @Field(() => MemberType, { nullable: true })
  @IsOptional()
  @IsEnum(MemberType)
  type?: MemberType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

@InputType()
export class UpdateMemberStatusByAdminInput {
  @Field(() => String)
  @IsMongoId()
  memberId: string;

  @Field(() => MemberStatus)
  @IsEnum(MemberStatus)
  status: MemberStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
