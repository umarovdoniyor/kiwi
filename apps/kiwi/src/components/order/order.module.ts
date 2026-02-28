import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { CartItemSchema, CartSchema } from '../../schemas/Cart.model';
import {
  OrderCounterSchema,
  OrderItemSchema,
  OrderSchema,
} from '../../schemas/Order.model';
import { ProductSchema } from '../../schemas/Product.model';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Cart', schema: CartSchema },
      { name: 'CartItem', schema: CartItemSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'OrderItem', schema: OrderItemSchema },
      { name: 'OrderCounter', schema: OrderCounterSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
  ],
  providers: [OrderService, OrderResolver],
  exports: [OrderService],
})
export class OrderModule {}
