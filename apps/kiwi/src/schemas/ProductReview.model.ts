import { Schema } from 'mongoose';
import { ProductReviewStatus } from '../libs/enums/product-review.enum';

const MemberSnapshotSchema = new Schema(
  {
    memberNickname: { type: String, default: null },
    memberFirstName: { type: String, default: null },
    memberLastName: { type: String, default: null },
    memberAvatar: { type: String, default: null },
  },
  { _id: false },
);

const ProductReviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1200, default: null },
    images: { type: [String], default: [] },

    status: {
      type: String,
      enum: Object.values(ProductReviewStatus),
      default: ProductReviewStatus.PENDING,
      index: true,
    },

    memberSnapshot: { type: MemberSnapshotSchema, default: undefined },

    moderationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
    moderatedAt: { type: Date, default: null },

    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'product_reviews',
  },
);

ProductReviewSchema.index(
  { productId: 1, memberId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

ProductReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ProductReviewSchema.index({ memberId: 1, createdAt: -1 });

export default ProductReviewSchema;
