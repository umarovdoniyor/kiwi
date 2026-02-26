import { Schema } from 'mongoose';
import { ProductUnit, ProductStatus } from '../libs/enums/product.enum';

export const ProductSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    categoryIds: [
      { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    ],

    brand: { type: String, trim: true, default: '' },
    sku: { type: String, trim: true, default: null },

    unit: { type: String, enum: Object.values(ProductUnit), required: true },
    price: { type: Number, required: true, min: 0.01 },
    salePrice: { type: Number, default: null, min: 0 },

    stockQty: { type: Number, required: true, min: 0, default: 0 },
    minOrderQty: { type: Number, min: 1, default: 1 },

    tags: { type: [String], default: [] },
    images: { type: [String], required: true, default: [] },
    thumbnail: { type: String, default: '' },

    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.DRAFT,
      index: true,
    },

    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'products',
  },
);

ProductSchema.index({ memberId: 1, createdAt: -1 });
ProductSchema.index({ memberId: 1, status: 1 });
ProductSchema.index({ memberId: 1, sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });
