import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorResolver } from './vendor.resolver';
import { VendorService } from './vendor.service';
import { MemberSchema } from '../../schemas/Member.model';
import { ProductSchema } from '../../schemas/Product.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Member', schema: MemberSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [VendorResolver, VendorService],
})
export class VendorModule {}
