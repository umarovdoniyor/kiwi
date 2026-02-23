import { Schema } from 'mongoose';
import { VendorApplicationStatus } from '../libs/enums/member.enums';

export const VendorApplicationSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },

    storeName: { type: String, required: true },
    storeDescription: { type: String, required: true },
    businessLicense: { type: String, required: true },
    taxId: { type: String },

    status: {
      type: String,
      enum: Object.values(VendorApplicationStatus),
      default: VendorApplicationStatus.PENDING,
      index: true,
    },

    reviewedBy: { type: Schema.Types.ObjectId, ref: 'Member' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true, collection: 'vendor_applications' },
);

VendorApplicationSchema.index({ memberId: 1, status: 1 });
