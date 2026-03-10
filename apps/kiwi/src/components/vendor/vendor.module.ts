import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorResolver } from './vendor.resolver';
import { VendorService } from './vendor.service';
import { MemberSchema } from '../../schemas/Member.model';
import { ProductSchema } from '../../schemas/Product.model';
import ProductReviewSchema from '../../schemas/ProductReview.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Member', schema: MemberSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'ProductReview', schema: ProductReviewSchema },
    ]),
  ],
  providers: [VendorResolver, VendorService],
})
export class VendorModule {}
