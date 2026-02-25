import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { VendorApplicationStatus } from '../enums/member.enums';
import { Document } from 'mongoose';

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
