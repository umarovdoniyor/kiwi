import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { OrderModule } from './order/order.module';
import { VendorApplicationModule } from './vendor-application/vendor-application.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { UploaderModule } from './uploader/uploader.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    MemberModule,
    AuthModule,
    ProductModule,
    OrderModule,
    LikeModule,
    ViewModule,
    FollowModule,
    VendorApplicationModule,
    ProductCategoryModule,
    UploaderModule,
    WishlistModule,
  ],
})
export class ComponentsModule {}
