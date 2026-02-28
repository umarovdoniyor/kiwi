import { Schema } from 'mongoose';
import { CartItemStatus } from '../libs/enums/order.enum';

export const CartSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      unique: true,
      index: true,
    },
    itemsCount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true, collection: 'carts' },
);

export const CartItemSchema = new Schema(
  {
    cartId: {
      type: Schema.Types.ObjectId,
      ref: 'Cart',
      required: true,
      index: true,
    },
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
    vendorId: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: null, min: 0 },
    appliedPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(CartItemStatus),
      default: CartItemStatus.ACTIVE,
    },
    productSnapshotTitle: { type: String, required: true },
    productSnapshotThumbnail: { type: String, default: null },
    productSnapshotUnit: { type: String, default: null },
  },
  { timestamps: true, collection: 'cart_items' },
);

CartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true });
CartItemSchema.index({ memberId: 1, status: 1 });
