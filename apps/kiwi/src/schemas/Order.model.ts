import { Schema } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../libs/enums/order.enum';

export const OrderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
      index: true,
    },

    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },

    addressFullName: { type: String, required: true },
    addressPhone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: null },
    addressCity: { type: String, required: true },
    addressState: { type: String, default: null },
    addressPostalCode: { type: String, required: true },
    addressCountry: { type: String, required: true },

    note: { type: String, default: null },
    placedAt: { type: Date, default: Date.now },
    canceledAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'orders' },
);

OrderSchema.index({ memberId: 1, createdAt: -1 });
OrderSchema.index({ memberId: 1, status: 1, createdAt: -1 });

export const OrderItemSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
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

    productSnapshotTitle: { type: String, required: true },
    productSnapshotThumbnail: { type: String, default: null },
    productSnapshotUnit: { type: String, default: null },
    productSnapshotSku: { type: String, default: null },
  },
  { timestamps: true, collection: 'order_items' },
);

OrderItemSchema.index({ orderId: 1, createdAt: 1 });
OrderItemSchema.index({ memberId: 1, createdAt: -1 });

export const OrderCounterSchema = new Schema(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: 'order_counters' },
);
