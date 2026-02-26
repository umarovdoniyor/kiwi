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

registerEnumType(ProductStatus, { name: 'ProductStatus' });
registerEnumType(ProductUnit, { name: 'ProductUnit' });
