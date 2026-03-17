import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import {
  AddToCartInput,
  AdminOrdersInquiryInput,
  CancelOrderByAdminInput,
  CancelMyOrderInput,
  Cart,
  CheckoutSummary,
  CreateOrderFromCartInput,
  GetMyOrdersInput,
  Order,
  OrderByAdmin,
  OrdersByAdmin,
  OrdersByMember,
  RemoveCartItemInput,
  UpdateOrderStatusByAdminInput,
  UpdateMyVendorOrderItemStatusInput,
  UpdateCartItemQtyInput,
  ValidateCartForCheckoutOutput,
  VendorOrderDTO,
  VendorOrdersInquiryInput,
  VendorOrdersResult,
  VendorOrderItemStatusUpdateOutput,
} from '../../libs/dto/order/order';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enums';

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

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Mutation(() => VendorOrderItemStatusUpdateOutput)
  public async updateMyVendorOrderItemStatus(
    @AuthMember('sub') vendorId: string,
    @Args('input') input: UpdateMyVendorOrderItemStatusInput,
  ): Promise<VendorOrderItemStatusUpdateOutput> {
    console.log('Mutation: updateMyVendorOrderItemStatus');
    return await this.orderService.updateMyVendorOrderItemStatus(
      vendorId,
      input,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Query(() => VendorOrdersResult)
  public async getMyVendorOrders(
    @AuthMember('sub') vendorId: string,
    @Args('input') input: VendorOrdersInquiryInput,
  ): Promise<VendorOrdersResult> {
    console.log('Query: getMyVendorOrders');
    return await this.orderService.getMyVendorOrders(vendorId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.VENDOR)
  @Query(() => VendorOrderDTO, { nullable: true })
  public async getMyVendorOrderById(
    @AuthMember('sub') vendorId: string,
    @Args('orderId') orderId: string,
  ) {
    console.log('Query: getMyVendorOrderById');
    return await this.orderService.getMyVendorOrderById(vendorId, orderId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => OrdersByAdmin)
  public async getOrdersByAdmin(
    @Args('input') input: AdminOrdersInquiryInput,
  ): Promise<OrdersByAdmin> {
    console.log('Query: getOrdersByAdmin');
    return await this.orderService.getOrdersByAdmin(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => OrderByAdmin, { nullable: true })
  public async getOrderByIdByAdmin(
    @Args('orderId') orderId: string,
  ): Promise<OrderByAdmin | null> {
    console.log('Query: getOrderByIdByAdmin');
    return await this.orderService.getOrderByIdByAdmin(orderId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => OrderByAdmin)
  public async updateOrderStatusByAdmin(
    @Args('input') input: UpdateOrderStatusByAdminInput,
  ): Promise<OrderByAdmin> {
    console.log('Mutation: updateOrderStatusByAdmin');
    return await this.orderService.updateOrderStatusByAdmin(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => OrderByAdmin)
  public async cancelOrderByAdmin(
    @Args('input') input: CancelOrderByAdminInput,
  ): Promise<OrderByAdmin> {
    console.log('Mutation: cancelOrderByAdmin');
    return await this.orderService.cancelOrderByAdmin(input);
  }
}
