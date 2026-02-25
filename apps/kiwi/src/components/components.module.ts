import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { OrderModule } from './order/order.module';
import { VendorApplicationModule } from './vendor-application/vendor-application.module';

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
  ],
})
export class ComponentsModule {}
