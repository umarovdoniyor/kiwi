import { Schema } from 'mongoose';
import { MemberType, MemberStatus } from '../libs/enums/member.enums';

const VendorProfileSchema = new Schema(
  {
    storeName: { type: String },
    storeDescription: { type: String },
    businessLicense: { type: String },
    taxId: { type: String },
  },
  { _id: false },
);

export const MemberSchema = new Schema(
  {
    memberType: {
      type: String,
      enum: Object.values(MemberType),
      default: MemberType.CUSTOMER,
      index: true,
    },
    memberStatus: {
      type: String,
      enum: Object.values(MemberStatus),
      default: MemberStatus.ACTIVE,
      index: true,
    },

    memberEmail: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    memberPhone: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    memberPassword: {
      type: String,
      select: false,
      required: true,
    },

    memberNickname: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      index: true,
    },
    memberFirstName: { type: String, required: true },
    memberLastName: { type: String, required: true },
    memberAvatar: { type: String, default: '' },
    memberAddress: { type: String },

    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    vendorProfile: {
      type: VendorProfileSchema,
      default: undefined,
    },

    lastLoginAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true, collection: 'members' },
);

// Optional indexes
MemberSchema.index({ memberEmail: 1 });
MemberSchema.index({ memberPhone: 1 });
