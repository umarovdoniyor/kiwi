import { registerEnumType } from '@nestjs/graphql';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ProductUnit {
  PCS = 'PCS',
  KG = 'KG',
  G = 'G',
  L = 'L',
  ML = 'ML',
  PACK = 'PACK',
}

export enum ProductSortBy {
  NEWEST = 'NEWEST',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  POPULAR = 'POPULAR',
}

registerEnumType(ProductStatus, { name: 'ProductStatus' });
registerEnumType(ProductUnit, { name: 'ProductUnit' });
registerEnumType(ProductSortBy, { name: 'ProductSortBy' });
