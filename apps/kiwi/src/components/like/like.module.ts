import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikeService } from './like.service';
import { LikeResolver } from './like.resolver';
import LikeSchema from '../../schemas/Like.model';
import { ProductSchema } from '../../schemas/Product.model';
import { MemberSchema } from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Like', schema: LikeSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Member', schema: MemberSchema },
    ]),
  ],
  providers: [LikeService, LikeResolver],
  exports: [LikeService],
})
export class LikeModule {}
