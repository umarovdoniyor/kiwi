import { ObjectType, Field, ID } from '@nestjs/graphql';
import { MemberStatus, MemberType } from '../../enums/member.enums';
import type { ObjectId } from 'mongoose';

@ObjectType()
export class VendorProfileResponse {
  @Field()
  storeName: string;

  @Field()
  storeDescription: string;

  @Field()
  businessLicense: string;

  @Field()
  taxId: string;
}

@ObjectType()
export class MemberResponse {
  @Field(() => ID)
  _id: ObjectId;

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

  @Field({ nullable: true })
  memberAvatar?: string;

  @Field(() => MemberType)
  memberType: MemberType;

  @Field(() => MemberStatus)
  memberStatus: MemberStatus;

  @Field({ nullable: true })
  vendorProfile?: VendorProfileResponse;

  @Field()
  isEmailVerified: boolean;

  @Field()
  isPhoneVerified: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field()
  createdAt: Date;
}
