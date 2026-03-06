import { Schema } from 'mongoose';

const WishlistSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
  },
  { timestamps: true, collection: 'wishlists' },
);

WishlistSchema.index({ memberId: 1, productId: 1 }, { unique: true });
WishlistSchema.index({ memberId: 1, createdAt: -1 });

export default WishlistSchema;
