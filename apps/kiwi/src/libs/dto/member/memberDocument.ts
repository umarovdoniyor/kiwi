import { Document } from 'mongoose';
import { MemberStatus, MemberType } from '../../enums/member.enums';

export interface VendorProfile {
  storeName: string;
  storeDescription: string;
  businessLicense: string;
  taxId?: string;
}

export interface MemberDocument extends Document {
  memberEmail: string;
  memberPhone?: string;
  memberNickname: string;
  memberPassword: string; // select: false in schema
  memberFirstName: string;
  memberLastName: string;
  memberAvatar?: string;
  memberAddress?: string;
  memberType: MemberType;
  memberStatus: MemberStatus;
  vendorProfile?: VendorProfile;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // soft delete
}
