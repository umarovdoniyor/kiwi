import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
  PRODUCT = 'PRODUCT',
  MEMBER = 'MEMBER',
  VENDOR = 'VENDOR',
  SHOP = 'SHOP',
}

registerEnumType(ViewGroup, {
  name: 'ViewGroup',
});
