import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
  MEMBER = 'MEMBER',
  PRODUCT = 'PRODUCT',
  VENDOR = 'VENDOR',
  SHOP = 'SHOP',
}
registerEnumType(LikeGroup, {
  name: 'LikeGroup',
});
