import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import {
  AddToCartInput,
  CancelMyOrderInput,
  Cart,
  CheckoutSummary,
  CreateOrderFromCartInput,
  GetMyOrdersInput,
  Order,
  OrdersByMember,
  RemoveCartItemInput,
  UpdateCartItemQtyInput,
  ValidateCartForCheckoutOutput,
} from '../../libs/dto/order/order';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard)
  @Query(() => Cart)
  public async getMyCart(@AuthMember('sub') memberId: string): Promise<Cart> {
    console.log('Query: getMyCart');
    return await this.orderService.getMyCart(memberId);
  }

  @UseGuards(AuthGuard)
  @Query(() => CheckoutSummary)
  public async getCheckoutSummary(
    @AuthMember('sub') memberId: string,
  ): Promise<CheckoutSummary> {
    console.log('Query: getCheckoutSummary');
    return await this.orderService.getCheckoutSummary(memberId);
  }

  @UseGuards(AuthGuard)
  @Query(() => OrdersByMember)
  public async getMyOrders(
    @AuthMember('sub') memberId: string,
    @Args('input') input: GetMyOrdersInput,
  ): Promise<OrdersByMember> {
    console.log('Query: getMyOrders');
    return await this.orderService.getMyOrders(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Order, { nullable: true })
  public async getMyOrderById(
    @AuthMember('sub') memberId: string,
    @Args('orderId') orderId: string,
  ): Promise<Order | null> {
    console.log('Query: getMyOrderById');
    return await this.orderService.getMyOrderById(memberId, orderId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Cart)
  public async addToCart(
    @AuthMember('sub') memberId: string,
    @Args('input') input: AddToCartInput,
  ): Promise<Cart> {
    console.log('Mutation: addToCart');
    return await this.orderService.addToCart(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Cart)
  public async updateCartItemQty(
    @AuthMember('sub') memberId: string,
    @Args('input') input: UpdateCartItemQtyInput,
  ): Promise<Cart> {
    console.log('Mutation: updateCartItemQty');
    return await this.orderService.updateCartItemQty(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Cart)
  public async removeCartItem(
    @AuthMember('sub') memberId: string,
    @Args('input') input: RemoveCartItemInput,
  ): Promise<Cart> {
    console.log('Mutation: removeCartItem');
    return await this.orderService.removeCartItem(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Cart)
  public async clearCart(@AuthMember('sub') memberId: string): Promise<Cart> {
    console.log('Mutation: clearCart');
    return await this.orderService.clearCart(memberId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => ValidateCartForCheckoutOutput)
  public async validateCartForCheckout(
    @AuthMember('sub') memberId: string,
  ): Promise<ValidateCartForCheckoutOutput> {
    console.log('Mutation: validateCartForCheckout');
    return await this.orderService.validateCartForCheckout(memberId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Order)
  public async createOrderFromCart(
    @AuthMember('sub') memberId: string,
    @Args('input') input: CreateOrderFromCartInput,
  ): Promise<Order> {
    console.log('Mutation: createOrderFromCart');
    return await this.orderService.createOrderFromCart(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Order)
  public async cancelMyOrder(
    @AuthMember('sub') memberId: string,
    @Args('input') input: CancelMyOrderInput,
  ): Promise<Order> {
    console.log('Mutation: cancelMyOrder');
    return await this.orderService.cancelMyOrder(memberId, input);
  }
}
