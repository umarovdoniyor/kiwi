import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { WishlistResolver } from './wishlist.resolver';
import { WishlistService } from './wishlist.service';
import WishlistSchema from '../../schemas/Wishlist.model';
import { ProductSchema } from '../../schemas/Product.model';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Wishlist', schema: WishlistSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [WishlistResolver, WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
