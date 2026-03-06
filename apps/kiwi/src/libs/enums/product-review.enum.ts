import { registerEnumType } from '@nestjs/graphql';

export enum ProductReviewStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  REJECTED = 'REJECTED',
}

export enum ProductReviewSortBy {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  RATING_DESC = 'RATING_DESC',
  RATING_ASC = 'RATING_ASC',
  WITH_IMAGES = 'WITH_IMAGES',
}

registerEnumType(ProductReviewStatus, { name: 'ProductReviewStatus' });
registerEnumType(ProductReviewSortBy, { name: 'ProductReviewSortBy' });
