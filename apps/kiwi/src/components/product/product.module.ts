import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductService } from './product.service';
import { ProductResolver } from './product.resolver';
import { ProductSchema } from '../../schemas/Product.model';
import { CategorySchema } from '../../schemas/Product-Category.model';
import LikeSchema from '../../schemas/Like.model';
import ViewSchema from '../../schemas/View.model';
import { MemberSchema } from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductSchema },
      { name: 'Category', schema: CategorySchema },
      { name: 'Like', schema: LikeSchema },
      { name: 'View', schema: ViewSchema },
      { name: 'Member', schema: MemberSchema },
    ]),
  ],
  providers: [ProductService, ProductResolver],
  exports: [ProductService],
})
export class ProductModule {}
