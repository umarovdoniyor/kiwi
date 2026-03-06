import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ProductReviewResolver } from './product-review.resolver';
import { ProductReviewService } from './product-review.service';
import ProductReviewSchema from '../../schemas/ProductReview.model';
import { ProductSchema } from '../../schemas/Product.model';
import { OrderItemSchema } from '../../schemas/Order.model';
import { MemberSchema } from '../../schemas/Member.model';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'ProductReview', schema: ProductReviewSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'OrderItem', schema: OrderItemSchema },
      { name: 'Member', schema: MemberSchema },
    ]),
  ],
  providers: [ProductReviewResolver, ProductReviewService],
  exports: [ProductReviewService],
})
export class ProductReviewModule {}
