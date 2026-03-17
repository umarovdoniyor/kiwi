import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import {
  AddToCartInput,
  AdminOrdersInquiryInput,
  CancelOrderByAdminInput,
  CancelMyOrderInput,
  Cart,
  CartItem,
  CheckoutIssue,
  CheckoutSummary,
  CreateOrderFromCartInput,
  GetMyOrdersInput,
  Order,
  OrderByAdmin,
  OrderItem,
  OrderItemByAdmin,
  OrdersByAdmin,
  OrdersByMember,
  RemoveCartItemInput,
  UpdateOrderStatusByAdminInput,
  UpdateMyVendorOrderItemStatusInput,
  UpdateCartItemQtyInput,
  ValidateCartForCheckoutOutput,
  VendorOrderDTO,
  VendorOrderItemDTO,
  VendorOrdersInquiryInput,
  VendorOrdersResult,
  VendorOrderItemStatusUpdateOutput,
} from '../../libs/dto/order/order';
import {
  CartItemStatus,
  OrderStatus,
  PaymentStatus,
} from '../../libs/enums/order.enum';
import { Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/product.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel('Cart')
    private readonly cartModel: Model<any>,
    @InjectModel('CartItem')
    private readonly cartItemModel: Model<any>,
    @InjectModel('Order')
    private readonly orderModel: Model<any>,
    @InjectModel('OrderItem')
    private readonly orderItemModel: Model<any>,
    @InjectModel('OrderCounter')
    private readonly orderCounterModel: Model<any>,
    @InjectModel('Product')
    private readonly productModel: Model<any>,
  ) {}

  private readonly defaultCurrency = process.env.CHECKOUT_CURRENCY || 'USD';
  private readonly taxRate = Number(process.env.CHECKOUT_TAX_RATE ?? 0);
  private readonly flatDeliveryFee = Number(
    process.env.CHECKOUT_DELIVERY_FEE ?? 0,
  );
  private readonly freeDeliveryThreshold = Number(
    process.env.CHECKOUT_FREE_DELIVERY_THRESHOLD ?? 0,
  );

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private resolveAppliedPrice(product: any): {
    unitPrice: number;
    salePrice: number | null;
    appliedPrice: number;
  } {
    const unitPrice = this.roundMoney(Number(product?.price || 0));

    const rawSalePrice =
      product?.salePrice === null || product?.salePrice === undefined
        ? null
        : Number(product.salePrice);

    const isValidSalePrice =
      rawSalePrice !== null &&
      Number.isFinite(rawSalePrice) &&
      rawSalePrice >= 0 &&
      rawSalePrice <= unitPrice;

    const salePrice = isValidSalePrice ? this.roundMoney(rawSalePrice) : null;
    const appliedPrice = salePrice ?? unitPrice;

    return { unitPrice, salePrice, appliedPrice };
  }

  private resolveDeliveryFee(subtotal: number): number {
    if (subtotal <= 0) {
      return 0;
    }

    if (
      this.freeDeliveryThreshold > 0 &&
      subtotal >= this.freeDeliveryThreshold
    ) {
      return 0;
    }

    return this.roundMoney(Math.max(this.flatDeliveryFee, 0));
  }

  private toCheckoutIssue(
    code: string,
    message: string,
    productId?: string,
    requestedQty?: number,
    availableQty?: number,
  ): CheckoutIssue {
    return {
      code,
      message,
      productId,
      requestedQty,
      availableQty,
    };
  }

  private toCartItemResponse(item: any): CartItem {
    return {
      _id: item._id.toString(),
      cartId: item.cartId.toString(),
      memberId: item.memberId.toString(),
      productId: item.productId.toString(),
      vendorId: item.vendorId ? item.vendorId.toString() : null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      salePrice: item.salePrice,
      appliedPrice: item.appliedPrice,
      lineTotal: item.lineTotal,
      status: item.status,
      productSnapshotTitle: item.productSnapshotTitle,
      productSnapshotThumbnail: item.productSnapshotThumbnail,
      productSnapshotUnit: item.productSnapshotUnit,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toOrderItemResponse(item: any): OrderItem {
    return {
      _id: item._id.toString(),
      orderId: item.orderId.toString(),
      memberId: item.memberId.toString(),
      productId: item.productId.toString(),
      vendorId: item.vendorId ? item.vendorId.toString() : null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      salePrice: item.salePrice,
      appliedPrice: item.appliedPrice,
      lineTotal: item.lineTotal,
      productSnapshotTitle: item.productSnapshotTitle,
      productSnapshotThumbnail: item.productSnapshotThumbnail,
      productSnapshotUnit: item.productSnapshotUnit,
      productSnapshotSku: item.productSnapshotSku,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toOrderItemByAdmin(item: any): OrderItemByAdmin {
    return {
      _id: item._id.toString(),
      orderId: item.orderId.toString(),
      productId: item.productId.toString(),
      vendorId: item.vendorId ? item.vendorId.toString() : null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      salePrice: item.salePrice,
      appliedPrice: item.appliedPrice,
      lineTotal: item.lineTotal,
      productSnapshotTitle: item.productSnapshotTitle,
      productSnapshotThumbnail: item.productSnapshotThumbnail,
      productSnapshotUnit: item.productSnapshotUnit,
      productSnapshotSku: item.productSnapshotSku,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toVendorOrderItemResponse(item: any): VendorOrderItemDTO {
    return {
      _id: item._id.toString(),
      orderId: item.orderId.toString(),
      memberId: item.memberId.toString(),
      productId: item.productId.toString(),
      vendorId: item.vendorId.toString(),
      status: item.status,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      salePrice: item.salePrice,
      appliedPrice: item.appliedPrice,
      lineTotal: item.lineTotal,
      productSnapshotTitle: item.productSnapshotTitle,
      productSnapshotThumbnail: item.productSnapshotThumbnail,
      productSnapshotUnit: item.productSnapshotUnit,
      productSnapshotSku: item.productSnapshotSku,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toCartResponse(cart: any, items: any[]): Cart {
    return {
      _id: cart._id.toString(),
      memberId: cart.memberId.toString(),
      items: items.map((item) => this.toCartItemResponse(item)),
      itemsCount: cart.itemsCount,
      subtotal: cart.subtotal,
      discountAmount: cart.discountAmount,
      deliveryFee: cart.deliveryFee,
      taxAmount: cart.taxAmount,
      totalAmount: cart.totalAmount,
      currency: cart.currency,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private toOrderResponse(order: any, items: any[]): Order {
    return {
      _id: order._id.toString(),
      orderNo: order.orderNo,
      memberId: order.memberId.toString(),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      deliveryFee: order.deliveryFee,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      addressFullName: order.addressFullName,
      addressPhone: order.addressPhone,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      addressCity: order.addressCity,
      addressState: order.addressState,
      addressPostalCode: order.addressPostalCode,
      addressCountry: order.addressCountry,
      note: order.note,
      placedAt: order.placedAt,
      canceledAt: order.canceledAt,
      deliveredAt: order.deliveredAt,
      items: items.map((item) => this.toOrderItemResponse(item)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private toOrderByAdmin(order: any, items: any[]): OrderByAdmin {
    return {
      _id: order._id.toString(),
      orderNo: order.orderNo,
      memberId: order.memberId.toString(),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      deliveryFee: order.deliveryFee,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      addressFullName: order.addressFullName,
      addressPhone: order.addressPhone,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      addressCity: order.addressCity,
      addressState: order.addressState,
      addressPostalCode: order.addressPostalCode,
      addressCountry: order.addressCountry,
      note: order.note,
      placedAt: order.placedAt,
      canceledAt: order.canceledAt,
      deliveredAt: order.deliveredAt,
      items: items.map((item) => this.toOrderItemByAdmin(item)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private toVendorOrderResponse(order: any, items: any[]): VendorOrderDTO {
    return {
      _id: order._id.toString(),
      orderNo: order.orderNo,
      memberId: order.memberId.toString(),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      deliveryFee: order.deliveryFee,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      addressFullName: order.addressFullName,
      addressPhone: order.addressPhone,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      addressCity: order.addressCity,
      addressState: order.addressState,
      addressPostalCode: order.addressPostalCode,
      addressCountry: order.addressCountry,
      note: order.note,
      placedAt: order.placedAt,
      canceledAt: order.canceledAt,
      deliveredAt: order.deliveredAt,
      items: items.map((item) => this.toVendorOrderItemResponse(item)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private async getOrCreateCart(memberId: string, session?: any): Promise<any> {
    let cart = await this.cartModel
      .findOne({ memberId })
      .session(session || null)
      .exec();

    if (cart) {
      return cart;
    }

    try {
      [cart] = await this.cartModel.create(
        [
          {
            memberId,
            itemsCount: 0,
            subtotal: 0,
            discountAmount: 0,
            deliveryFee: 0,
            taxAmount: 0,
            totalAmount: 0,
            currency: this.defaultCurrency,
          },
        ],
        { session },
      );
      return cart;
    } catch (err) {
      if (err?.code !== 11000) {
        throw err;
      }

      cart = await this.cartModel
        .findOne({ memberId })
        .session(session || null)
        .exec();
      if (!cart) {
        throw err;
      }
      return cart;
    }
  }

  private async getActiveCartItems(
    cartId: string,
    session?: any,
  ): Promise<any[]> {
    return this.cartItemModel
      .find({ cartId, status: CartItemStatus.ACTIVE })
      .sort({ createdAt: 1 })
      .session(session || null)
      .exec();
  }

  private buildSummary(subtotalInput: number): CheckoutSummary {
    const subtotal = this.roundMoney(Math.max(subtotalInput, 0));
    const discountAmount = 0;
    const taxBase = Math.max(subtotal - discountAmount, 0);
    const taxAmount = this.roundMoney(taxBase * Math.max(this.taxRate, 0));
    const deliveryFee = this.resolveDeliveryFee(subtotal);
    const totalAmount = this.roundMoney(
      subtotal - discountAmount + deliveryFee + taxAmount,
    );

    return {
      subtotal,
      discountAmount,
      deliveryFee,
      taxAmount,
      totalAmount,
      currency: this.defaultCurrency,
    };
  }

  private async recalculateCart(
    cartId: string,
    memberId: string,
    session?: any,
  ): Promise<Cart> {
    const [cart, items] = await Promise.all([
      this.cartModel
        .findOne({ _id: cartId, memberId })
        .session(session || null)
        .exec(),
      this.getActiveCartItems(cartId, session),
    ]);

    if (!cart) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const subtotal = this.roundMoney(
      items.reduce(
        (sum: number, item: any) => sum + Number(item.lineTotal || 0),
        0,
      ),
    );

    const summary = this.buildSummary(subtotal);

    cart.itemsCount = items.length;
    cart.subtotal = summary.subtotal;
    cart.discountAmount = summary.discountAmount;
    cart.deliveryFee = summary.deliveryFee;
    cart.taxAmount = summary.taxAmount;
    cart.totalAmount = summary.totalAmount;
    cart.currency = summary.currency;
    await cart.save({ session });

    return this.toCartResponse(cart, items);
  }

  private validateProductForCart(
    product: any,
    requestedQty: number,
  ): CheckoutIssue[] {
    const issues: CheckoutIssue[] = [];

    if (!product || product.deletedAt) {
      issues.push(
        this.toCheckoutIssue(
          'PRODUCT_NOT_AVAILABLE',
          'Product does not exist or is archived',
          product?._id?.toString(),
          requestedQty,
        ),
      );
      return issues;
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      issues.push(
        this.toCheckoutIssue(
          'PRODUCT_NOT_PUBLISHED',
          'Product is not published',
          product._id.toString(),
          requestedQty,
        ),
      );
    }

    const minOrderQty = Number(product.minOrderQty || 1);
    const stockQty = Number(product.stockQty || 0);

    if (requestedQty < minOrderQty) {
      issues.push(
        this.toCheckoutIssue(
          'BELOW_MIN_ORDER_QTY',
          `Requested quantity is below minimum order quantity (${minOrderQty})`,
          product._id.toString(),
          requestedQty,
          minOrderQty,
        ),
      );
    }

    if (stockQty < requestedQty) {
      issues.push(
        this.toCheckoutIssue(
          'INSUFFICIENT_STOCK',
          'Insufficient stock quantity',
          product._id.toString(),
          requestedQty,
          stockQty,
        ),
      );
    }

    return issues;
  }

  private async buildOrderNo(session: any): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = `${now.getMonth() + 1}`.padStart(2, '0');
    const dd = `${now.getDate()}`.padStart(2, '0');
    const dateKey = `${yyyy}${mm}${dd}`;

    const counter = await this.orderCounterModel
      .findOneAndUpdate(
        { dateKey },
        { $inc: { seq: 1 } },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          session,
        },
      )
      .exec();

    const seq = `${counter.seq}`.padStart(6, '0');
    return `GS-${dateKey}-${seq}`;
  }

  private async findOrderWithItemsById(
    orderId: string,
    memberId: string,
  ): Promise<Order | null> {
    const order = await this.orderModel
      .findOne({ _id: orderId, memberId })
      .exec();

    if (!order) {
      return null;
    }

    const items = await this.orderItemModel
      .find({ orderId: order._id })
      .sort({ createdAt: 1 })
      .exec();

    return this.toOrderResponse(order, items);
  }

  private async findOrderWithItemsByIdByAdmin(
    orderId: string,
  ): Promise<OrderByAdmin | null> {
    const order = await this.orderModel.findOne({ _id: orderId }).exec();

    if (!order) {
      return null;
    }

    const items = await this.orderItemModel
      .find({ orderId: order._id })
      .sort({ createdAt: 1 })
      .exec();

    return this.toOrderByAdmin(order, items);
  }

  private async findVendorOrderWithItemsById(
    vendorId: string,
    orderId: string,
  ): Promise<VendorOrderDTO | null> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      return null;
    }

    const items = await this.orderItemModel
      .find({ orderId: order._id, vendorId })
      .sort({ createdAt: 1 })
      .exec();

    if (items.length === 0) {
      return null;
    }

    return this.toVendorOrderResponse(order, items);
  }

  private getVendorItemTransitionRank(status?: OrderStatus): number {
    switch (status) {
      case OrderStatus.PACKING:
        return 1;
      case OrderStatus.SHIPPED:
        return 2;
      case OrderStatus.DELIVERED:
        return 3;
      default:
        return 0;
    }
  }

  private validateVendorItemTransition(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
  ): void {
    const allowedTargets = new Set<OrderStatus>([
      OrderStatus.PACKING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ]);

    if (!allowedTargets.has(nextStatus)) {
      throw new BadRequestException(
        'Invalid status. Allowed values: PACKING, SHIPPED, DELIVERED',
      );
    }

    if (currentStatus === OrderStatus.CANCELED) {
      throw new BadRequestException('Canceled items cannot be updated');
    }

    if (currentStatus === OrderStatus.REFUNDED) {
      throw new BadRequestException('Refunded items cannot be updated');
    }

    const currentRank = this.getVendorItemTransitionRank(currentStatus);
    const nextRank = this.getVendorItemTransitionRank(nextStatus);

    if (nextRank <= currentRank) {
      throw new BadRequestException(
        'Backward or duplicate status transitions are not allowed',
      );
    }
  }

  public async getMyCart(memberId: string): Promise<Cart> {
    try {
      const cart = await this.getOrCreateCart(memberId);
      const items = await this.getActiveCartItems(cart._id.toString());
      return this.toCartResponse(cart, items);
    } catch (err) {
      console.log('Error, Service.getMyCart', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async updateMyVendorOrderItemStatus(
    vendorId: string,
    input: UpdateMyVendorOrderItemStatusInput,
  ): Promise<VendorOrderItemStatusUpdateOutput> {
    try {
      const order = await this.orderModel.findById(input.orderId).exec();
      if (!order) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      if (
        order.status === OrderStatus.CANCELED ||
        order.status === OrderStatus.REFUNDED
      ) {
        throw new BadRequestException(
          'Order is not updatable in its current status',
        );
      }

      const item = await this.orderItemModel
        .findOne({
          _id: input.itemId,
          orderId: input.orderId,
        })
        .exec();

      if (!item) {
        throw new BadRequestException(
          'Order item not found for the given order',
        );
      }

      if (!item.vendorId || item.vendorId.toString() !== vendorId) {
        throw new BadRequestException(
          'You are not allowed to update this order item',
        );
      }

      const currentStatus: OrderStatus =
        (item.status as OrderStatus) || (order.status as OrderStatus);

      this.validateVendorItemTransition(currentStatus, input.status);

      item.status = input.status;
      await item.save();

      return {
        orderId: input.orderId,
        itemId: item._id.toString(),
        status: item.status,
        updatedAt: item.updatedAt,
      };
    } catch (err) {
      console.log('Error, Service.updateMyVendorOrderItemStatus', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async getMyVendorOrders(
    vendorId: string,
    input: VendorOrdersInquiryInput,
  ): Promise<VendorOrdersResult> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;
      const trimmedOrderNo = input?.orderNo?.trim();
      const trimmedStatus = input?.status?.trim();

      if (
        trimmedStatus &&
        !Object.values(OrderStatus).includes(trimmedStatus as OrderStatus)
      ) {
        throw new BadRequestException('Invalid order status');
      }

      const vendorOrderIds = await this.orderItemModel
        .distinct('orderId', { vendorId })
        .exec();

      if (vendorOrderIds.length === 0) {
        return {
          list: [],
          metaCounter: { total: 0 },
        };
      }

      let scopedOrderIds = vendorOrderIds;

      if (trimmedStatus) {
        const vendorOrderIdsByItemStatus = await this.orderItemModel
          .distinct('orderId', { vendorId, status: trimmedStatus })
          .exec();

        const vendorOrderIdsByOrderStatus = await this.orderModel
          .distinct('_id', {
            _id: { $in: vendorOrderIds },
            status: trimmedStatus,
          })
          .exec();

        const scopedOrderIdsSet = new Set<string>([
          ...vendorOrderIdsByItemStatus.map((id: any) => id.toString()),
          ...vendorOrderIdsByOrderStatus.map((id: any) => id.toString()),
        ]);

        scopedOrderIds = vendorOrderIds.filter((id: any) =>
          scopedOrderIdsSet.has(id.toString()),
        );
      }

      if (scopedOrderIds.length === 0) {
        return {
          list: [],
          metaCounter: { total: 0 },
        };
      }

      const filter: any = {
        _id: { $in: scopedOrderIds },
      };

      if (trimmedOrderNo) {
        filter.orderNo = { $regex: trimmedOrderNo, $options: 'i' };
      }

      const [orders, total] = await Promise.all([
        this.orderModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.orderModel.countDocuments(filter).exec(),
      ]);

      const pagedOrderIds = orders.map((order) => order._id);
      const pagedItemFilter: any = {
        orderId: { $in: pagedOrderIds },
        vendorId,
      };

      const orderItems = await this.orderItemModel
        .find(pagedItemFilter)
        .sort({ createdAt: 1 })
        .exec();

      const itemsByOrderId = new Map<string, any[]>();
      for (const item of orderItems) {
        const key = item.orderId.toString();
        if (!itemsByOrderId.has(key)) {
          itemsByOrderId.set(key, []);
        }
        itemsByOrderId.get(key)?.push(item);
      }

      const list = orders
        .map((order) => {
          const items = itemsByOrderId.get(order._id.toString()) || [];
          if (items.length === 0) {
            return null;
          }
          return this.toVendorOrderResponse(order, items);
        })
        .filter((order): order is VendorOrderDTO => order !== null);

      return {
        list,
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getMyVendorOrders', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getMyVendorOrderById(
    vendorId: string,
    orderId: string,
  ): Promise<VendorOrderDTO | null> {
    try {
      return await this.findVendorOrderWithItemsById(vendorId, orderId);
    } catch (err) {
      console.log('Error, Service.getMyVendorOrderById', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getCheckoutSummary(memberId: string): Promise<CheckoutSummary> {
    try {
      const cart = await this.getOrCreateCart(memberId);
      const items = await this.getActiveCartItems(cart._id.toString());
      const subtotal = this.roundMoney(
        items.reduce(
          (sum: number, item: any) => sum + Number(item.lineTotal || 0),
          0,
        ),
      );
      return this.buildSummary(subtotal);
    } catch (err) {
      console.log('Error, Service.getCheckoutSummary', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async addToCart(
    memberId: string,
    input: AddToCartInput,
  ): Promise<Cart> {
    try {
      const cart = await this.getOrCreateCart(memberId);

      const product = await this.productModel
        .findOne({ _id: input.productId, deletedAt: null })
        .exec();

      if (!product) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const existingItem = await this.cartItemModel
        .findOne({ cartId: cart._id, productId: input.productId })
        .exec();

      const nextQty =
        existingItem && existingItem.status === CartItemStatus.ACTIVE
          ? Number(existingItem.quantity) + Number(input.quantity)
          : Number(input.quantity);

      const issues = this.validateProductForCart(product, nextQty);
      if (issues.length > 0) {
        throw new BadRequestException(issues[0].message);
      }

      const pricing = this.resolveAppliedPrice(product);
      const lineTotal = this.roundMoney(pricing.appliedPrice * nextQty);

      const payload = {
        memberId,
        cartId: cart._id,
        productId: product._id,
        vendorId: product.memberId || null,
        quantity: nextQty,
        unitPrice: pricing.unitPrice,
        salePrice: pricing.salePrice,
        appliedPrice: pricing.appliedPrice,
        lineTotal,
        status: CartItemStatus.ACTIVE,
        productSnapshotTitle: product.title,
        productSnapshotThumbnail: product.thumbnail || null,
        productSnapshotUnit: product.unit || null,
      };

      if (existingItem) {
        await this.cartItemModel
          .updateOne({ _id: existingItem._id }, { $set: payload })
          .exec();
      } else {
        await this.cartItemModel.create(payload);
      }

      return await this.recalculateCart(cart._id.toString(), memberId);
    } catch (err) {
      console.log('Error, Service.addToCart', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async updateCartItemQty(
    memberId: string,
    input: UpdateCartItemQtyInput,
  ): Promise<Cart> {
    try {
      const cartItem = await this.cartItemModel
        .findOne({
          _id: input.cartItemId,
          memberId,
          status: CartItemStatus.ACTIVE,
        })
        .exec();

      if (!cartItem) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const product = await this.productModel
        .findOne({ _id: cartItem.productId, deletedAt: null })
        .exec();

      const issues = this.validateProductForCart(product, input.quantity);
      if (issues.length > 0) {
        throw new BadRequestException(issues[0].message);
      }

      const pricing = this.resolveAppliedPrice(product);
      const lineTotal = this.roundMoney(
        pricing.appliedPrice * Number(input.quantity),
      );

      cartItem.quantity = Number(input.quantity);
      cartItem.unitPrice = pricing.unitPrice;
      cartItem.salePrice = pricing.salePrice;
      cartItem.appliedPrice = pricing.appliedPrice;
      cartItem.lineTotal = lineTotal;
      cartItem.vendorId = product.memberId || null;
      cartItem.productSnapshotTitle = product.title;
      cartItem.productSnapshotThumbnail = product.thumbnail || null;
      cartItem.productSnapshotUnit = product.unit || null;
      await cartItem.save();

      return await this.recalculateCart(cartItem.cartId.toString(), memberId);
    } catch (err) {
      console.log('Error, Service.updateCartItemQty', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async removeCartItem(
    memberId: string,
    input: RemoveCartItemInput,
  ): Promise<Cart> {
    try {
      const cartItem = await this.cartItemModel
        .findOne({
          _id: input.cartItemId,
          memberId,
          status: CartItemStatus.ACTIVE,
        })
        .exec();

      if (!cartItem) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      cartItem.status = CartItemStatus.REMOVED;
      await cartItem.save();

      return await this.recalculateCart(cartItem.cartId.toString(), memberId);
    } catch (err) {
      console.log('Error, Service.removeCartItem', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async clearCart(memberId: string): Promise<Cart> {
    try {
      const cart = await this.getOrCreateCart(memberId);

      await this.cartItemModel
        .updateMany(
          { cartId: cart._id, status: CartItemStatus.ACTIVE },
          { $set: { status: CartItemStatus.REMOVED } },
        )
        .exec();

      return await this.recalculateCart(cart._id.toString(), memberId);
    } catch (err) {
      console.log('Error, Service.clearCart', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async validateCartForCheckout(
    memberId: string,
  ): Promise<ValidateCartForCheckoutOutput> {
    try {
      const cart = await this.getOrCreateCart(memberId);
      const items = await this.getActiveCartItems(cart._id.toString());

      if (items.length === 0) {
        return {
          isValid: false,
          issues: [this.toCheckoutIssue('CART_EMPTY', 'Cart is empty')],
          summary: this.buildSummary(0),
        };
      }

      const productIds = items.map((item) => item.productId);
      const products = await this.productModel
        .find({ _id: { $in: productIds } })
        .exec();

      const productMap = new Map<string, any>(
        products.map((product) => [product._id.toString(), product]),
      );

      const issues: CheckoutIssue[] = [];
      let subtotal = 0;

      for (const item of items) {
        const product = productMap.get(item.productId.toString());

        if (!product) {
          issues.push(
            this.toCheckoutIssue(
              'PRODUCT_NOT_AVAILABLE',
              'Product does not exist or is archived',
              item.productId.toString(),
              item.quantity,
            ),
          );
          continue;
        }

        const validationIssues = this.validateProductForCart(
          product,
          item.quantity,
        );
        issues.push(...validationIssues);

        const pricing = this.resolveAppliedPrice(product);
        subtotal += this.roundMoney(
          pricing.appliedPrice * Number(item.quantity),
        );
      }

      const summary = this.buildSummary(subtotal);

      return {
        isValid: issues.length === 0,
        issues,
        summary,
      };
    } catch (err) {
      console.log('Error, Service.validateCartForCheckout', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async createOrderFromCart(
    memberId: string,
    input: CreateOrderFromCartInput,
  ): Promise<Order> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const cart = await this.getOrCreateCart(memberId, session);
      const cartItems = await this.getActiveCartItems(
        cart._id.toString(),
        session,
      );

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const productIds = cartItems.map((item) => item.productId);
      const products = await this.productModel
        .find({ _id: { $in: productIds } })
        .session(session)
        .exec();

      const productMap = new Map<string, any>(
        products.map((product) => [product._id.toString(), product]),
      );

      const issues: CheckoutIssue[] = [];
      const preparedOrderItems: any[] = [];
      let subtotal = 0;

      for (const cartItem of cartItems) {
        const product = productMap.get(cartItem.productId.toString());

        if (!product) {
          issues.push(
            this.toCheckoutIssue(
              'PRODUCT_NOT_AVAILABLE',
              'Product does not exist or is archived',
              cartItem.productId.toString(),
              cartItem.quantity,
            ),
          );
          continue;
        }

        const validationIssues = this.validateProductForCart(
          product,
          Number(cartItem.quantity),
        );

        if (validationIssues.length > 0) {
          issues.push(...validationIssues);
          continue;
        }

        const pricing = this.resolveAppliedPrice(product);
        const quantity = Number(cartItem.quantity);
        const lineTotal = this.roundMoney(pricing.appliedPrice * quantity);
        subtotal += lineTotal;

        preparedOrderItems.push({
          memberId,
          productId: product._id,
          vendorId: product.memberId || null,
          quantity,
          unitPrice: pricing.unitPrice,
          salePrice: pricing.salePrice,
          appliedPrice: pricing.appliedPrice,
          lineTotal,
          productSnapshotTitle: product.title,
          productSnapshotThumbnail: product.thumbnail || null,
          productSnapshotUnit: product.unit || null,
          productSnapshotSku: product.sku || null,
        });
      }

      if (issues.length > 0) {
        throw new BadRequestException(
          `Checkout validation failed: ${issues.map((issue) => issue.message).join(', ')}`,
        );
      }

      const summary = this.buildSummary(subtotal);
      const orderNo = await this.buildOrderNo(session);

      const [order] = await this.orderModel.create(
        [
          {
            orderNo,
            memberId,
            paymentMethod: input.paymentMethod,
            paymentStatus: PaymentStatus.UNPAID,
            status: OrderStatus.PENDING_PAYMENT,
            subtotal: summary.subtotal,
            discountAmount: summary.discountAmount,
            deliveryFee: summary.deliveryFee,
            taxAmount: summary.taxAmount,
            totalAmount: summary.totalAmount,
            currency: summary.currency,
            addressFullName: input.address.fullName,
            addressPhone: input.address.phone,
            addressLine1: input.address.line1,
            addressLine2: input.address.line2 || null,
            addressCity: input.address.city,
            addressState: input.address.state || null,
            addressPostalCode: input.address.postalCode,
            addressCountry: input.address.country,
            note: input.note || null,
            placedAt: new Date(),
          },
        ],
        { session },
      );

      const orderItemsPayload = preparedOrderItems.map((item) => ({
        ...item,
        orderId: order._id,
        status: order.status,
      }));

      await this.orderItemModel.insertMany(orderItemsPayload, { session });

      for (const item of preparedOrderItems) {
        const stockUpdateResult = await this.productModel
          .updateOne(
            {
              _id: item.productId,
              status: ProductStatus.PUBLISHED,
              deletedAt: null,
              stockQty: { $gte: item.quantity },
            },
            {
              $inc: {
                stockQty: -item.quantity,
                ordersCount: item.quantity,
              },
            },
            { session },
          )
          .exec();

        if (stockUpdateResult.modifiedCount !== 1) {
          throw new BadRequestException(
            'Stock update failed due to concurrent changes',
          );
        }
      }

      await this.cartItemModel
        .updateMany(
          { cartId: cart._id, status: CartItemStatus.ACTIVE },
          { $set: { status: CartItemStatus.REMOVED } },
          { session },
        )
        .exec();

      await this.cartModel
        .updateOne(
          { _id: cart._id },
          {
            $set: {
              itemsCount: 0,
              subtotal: 0,
              discountAmount: 0,
              deliveryFee: 0,
              taxAmount: 0,
              totalAmount: 0,
              currency: this.defaultCurrency,
            },
          },
          { session },
        )
        .exec();

      await session.commitTransaction();

      const finalOrder = await this.findOrderWithItemsById(
        order._id.toString(),
        memberId,
      );
      if (!finalOrder) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return finalOrder;
    } catch (err) {
      await session.abortTransaction();
      console.log('Error, Service.createOrderFromCart', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    } finally {
      await session.endSession();
    }
  }

  public async getMyOrders(
    memberId: string,
    input: GetMyOrdersInput,
  ): Promise<OrdersByMember> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const skip = (page - 1) * limit;

      const filter: any = {
        memberId,
        ...(input?.status ? { status: input.status } : {}),
      };

      if (input?.search) {
        filter.$or = [
          { orderNo: { $regex: input.search, $options: 'i' } },
          { addressFullName: { $regex: input.search, $options: 'i' } },
          { addressPhone: { $regex: input.search, $options: 'i' } },
        ];
      }

      const [orders, total] = await Promise.all([
        this.orderModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.orderModel.countDocuments(filter).exec(),
      ]);

      const orderIds = orders.map((order) => order._id);
      const orderItems = await this.orderItemModel
        .find({ orderId: { $in: orderIds } })
        .sort({ createdAt: 1 })
        .exec();

      const itemsByOrderId = new Map<string, any[]>();
      for (const item of orderItems) {
        const key = item.orderId.toString();
        if (!itemsByOrderId.has(key)) {
          itemsByOrderId.set(key, []);
        }
        itemsByOrderId.get(key)?.push(item);
      }

      return {
        list: orders.map((order) =>
          this.toOrderResponse(
            order,
            itemsByOrderId.get(order._id.toString()) || [],
          ),
        ),
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getMyOrders', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getMyOrderById(
    memberId: string,
    orderId: string,
  ): Promise<Order | null> {
    try {
      return await this.findOrderWithItemsById(orderId, memberId);
    } catch (err) {
      console.log('Error, Service.getMyOrderById', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async cancelMyOrder(
    memberId: string,
    input: CancelMyOrderInput,
  ): Promise<Order> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const order = await this.orderModel
        .findOne({ _id: input.orderId, memberId })
        .session(session)
        .exec();

      if (!order) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const cancellableStatuses = new Set<OrderStatus>([
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PAID,
        OrderStatus.CONFIRMED,
      ]);

      if (!cancellableStatuses.has(order.status)) {
        throw new BadRequestException(
          'Order cannot be canceled at current status',
        );
      }

      const orderItems = await this.orderItemModel
        .find({ orderId: order._id })
        .session(session)
        .exec();

      for (const item of orderItems) {
        await this.productModel
          .updateOne(
            { _id: item.productId, deletedAt: null },
            {
              $inc: {
                stockQty: item.quantity,
                ordersCount: -item.quantity,
              },
            },
            { session },
          )
          .exec();
      }

      order.status = OrderStatus.CANCELED;
      order.canceledAt = new Date();

      if (input.reason?.trim()) {
        const reasonText = `Cancel reason: ${input.reason.trim()}`;
        order.note = order.note ? `${order.note}\n${reasonText}` : reasonText;
      }

      await order.save({ session });
      await session.commitTransaction();

      const finalOrder = await this.findOrderWithItemsById(
        order._id.toString(),
        memberId,
      );
      if (!finalOrder) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return finalOrder;
    } catch (err) {
      await session.abortTransaction();
      console.log('Error, Service.cancelMyOrder', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    } finally {
      await session.endSession();
    }
  }

  public async getOrdersByAdmin(
    input: AdminOrdersInquiryInput,
  ): Promise<OrdersByAdmin> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter: any = {
        ...(input?.status ? { status: input.status } : {}),
        ...(input?.memberId ? { memberId: input.memberId } : {}),
      };

      if (input?.vendorId) {
        const orderIdsForVendor = await this.orderItemModel
          .distinct('orderId', { vendorId: input.vendorId })
          .exec();
        filter._id = { $in: orderIdsForVendor };
      }

      if (input?.search?.trim()) {
        const search = input.search.trim();
        filter.$or = [
          { orderNo: { $regex: search, $options: 'i' } },
          { addressFullName: { $regex: search, $options: 'i' } },
          { addressPhone: { $regex: search, $options: 'i' } },
        ];
      }

      const [orders, total] = await Promise.all([
        this.orderModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.orderModel.countDocuments(filter).exec(),
      ]);

      const orderIds = orders.map((order) => order._id);
      const orderItems = await this.orderItemModel
        .find({ orderId: { $in: orderIds } })
        .sort({ createdAt: 1 })
        .exec();

      const itemsByOrderId = new Map<string, any[]>();
      for (const item of orderItems) {
        const key = item.orderId.toString();
        if (!itemsByOrderId.has(key)) {
          itemsByOrderId.set(key, []);
        }
        itemsByOrderId.get(key)?.push(item);
      }

      return {
        list: orders.map((order) =>
          this.toOrderByAdmin(
            order,
            itemsByOrderId.get(order._id.toString()) || [],
          ),
        ),
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getOrdersByAdmin', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async getOrderByIdByAdmin(
    orderId: string,
  ): Promise<OrderByAdmin | null> {
    try {
      return await this.findOrderWithItemsByIdByAdmin(orderId);
    } catch (err) {
      console.log('Error, Service.getOrderByIdByAdmin', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async updateOrderStatusByAdmin(
    input: UpdateOrderStatusByAdminInput,
  ): Promise<OrderByAdmin> {
    try {
      const order = await this.orderModel.findById(input.orderId).exec();

      if (!order) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      if (input.status === OrderStatus.CANCELED) {
        throw new BadRequestException(
          'Use cancelOrderByAdmin for cancellation',
        );
      }

      order.status = input.status;

      if (input.status === OrderStatus.DELIVERED) {
        order.deliveredAt = new Date();
      }

      if (input.note?.trim()) {
        const noteText = `Admin note: ${input.note.trim()}`;
        order.note = order.note ? `${order.note}\n${noteText}` : noteText;
      }

      await order.save();

      const updatedOrder = await this.findOrderWithItemsByIdByAdmin(
        order._id.toString(),
      );
      if (!updatedOrder) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return updatedOrder;
    } catch (err) {
      console.log('Error, Service.updateOrderStatusByAdmin', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  public async cancelOrderByAdmin(
    input: CancelOrderByAdminInput,
  ): Promise<OrderByAdmin> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const order = await this.orderModel
        .findById(input.orderId)
        .session(session)
        .exec();

      if (!order) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const cancellableStatuses = new Set<OrderStatus>([
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PAID,
        OrderStatus.CONFIRMED,
      ]);

      if (!cancellableStatuses.has(order.status)) {
        throw new BadRequestException(
          'Order cannot be canceled at current status',
        );
      }

      const orderItems = await this.orderItemModel
        .find({ orderId: order._id })
        .session(session)
        .exec();

      for (const item of orderItems) {
        await this.productModel
          .updateOne(
            { _id: item.productId, deletedAt: null },
            {
              $inc: {
                stockQty: item.quantity,
                ordersCount: -item.quantity,
              },
            },
            { session },
          )
          .exec();
      }

      order.status = OrderStatus.CANCELED;
      order.canceledAt = new Date();

      const reasonText = `Admin cancel reason: ${input.reason.trim()}`;
      order.note = order.note ? `${order.note}\n${reasonText}` : reasonText;

      await order.save({ session });
      await session.commitTransaction();

      const finalOrder = await this.findOrderWithItemsByIdByAdmin(
        order._id.toString(),
      );
      if (!finalOrder) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      return finalOrder;
    } catch (err) {
      await session.abortTransaction();
      console.log('Error, Service.cancelOrderByAdmin', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    } finally {
      await session.endSession();
    }
  }
}
