import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ViewService } from './view.service';
import { ViewResolver } from './view.resolver';
import ViewSchema from '../../schemas/View.model';
import { ProductSchema } from '../../schemas/Product.model';
import { MemberSchema } from '../../schemas/Member.model';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'View', schema: ViewSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Member', schema: MemberSchema },
    ]),
  ],
  providers: [ViewService, ViewResolver],
  exports: [ViewService],
})
export class ViewModule {}
