import { Schema } from 'mongoose';
import { CategoryStatus } from '../libs/enums/product-category.enum';
export const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    description: { type: String, trim: true, default: '' },
    icon: { type: String, default: '' },
    image: { type: String, default: '' },

    status: {
      type: String,
      enum: Object.values(CategoryStatus),
      default: CategoryStatus.ACTIVE,
      index: true,
    },

    sortOrder: { type: Number, default: 0, index: true },

    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'categories',
  },
);

// Useful indexes
CategorySchema.index({ parentId: 1, sortOrder: 1 });
CategorySchema.index({ status: 1, sortOrder: 1 });
