import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  CartItemStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../enums/order.enum';
import { MetaCounter } from '../product/product';

@ObjectType()
export class CheckoutIssue {
  @Field(() => String)
  code: string;

  @Field(() => String)
  message: string;

  @Field(() => String, { nullable: true })
  productId?: string;

  @Field(() => Int, { nullable: true })
  requestedQty?: number;

  @Field(() => Int, { nullable: true })
  availableQty?: number;
}

@ObjectType()
export class CartItem {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  cartId: string;

  @Field(() => String)
  memberId: string;

  @Field(() => String)
  productId: string;

  @Field(() => String, { nullable: true })
  vendorId?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Number)
  unitPrice: number;

  @Field(() => Number, { nullable: true })
  salePrice?: number;

  @Field(() => Number)
  appliedPrice: number;

  @Field(() => Number)
  lineTotal: number;

  @Field(() => CartItemStatus)
  status: CartItemStatus;

  @Field(() => String)
  productSnapshotTitle: string;

  @Field(() => String, { nullable: true })
  productSnapshotThumbnail?: string;

  @Field(() => String, { nullable: true })
  productSnapshotUnit?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Cart {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  memberId: string;

  @Field(() => [CartItem])
  items: CartItem[];

  @Field(() => Int)
  itemsCount: number;

  @Field(() => Number)
  subtotal: number;

  @Field(() => Number)
  discountAmount: number;

  @Field(() => Number)
  deliveryFee: number;

  @Field(() => Number)
  taxAmount: number;

  @Field(() => Number)
  totalAmount: number;

  @Field(() => String)
  currency: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class CheckoutSummary {
  @Field(() => Number)
  subtotal: number;

  @Field(() => Number)
  discountAmount: number;

  @Field(() => Number)
  deliveryFee: number;

  @Field(() => Number)
  taxAmount: number;

  @Field(() => Number)
  totalAmount: number;

  @Field(() => String)
  currency: string;
}

@ObjectType()
export class ValidateCartForCheckoutOutput {
  @Field(() => Boolean)
  isValid: boolean;

  @Field(() => [CheckoutIssue])
  issues: CheckoutIssue[];

  @Field(() => CheckoutSummary)
  summary: CheckoutSummary;
}

@ObjectType()
export class OrderItem {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  orderId: string;

  @Field(() => String)
  memberId: string;

  @Field(() => String)
  productId: string;

  @Field(() => String, { nullable: true })
  vendorId?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Number)
  unitPrice: number;

  @Field(() => Number, { nullable: true })
  salePrice?: number;

  @Field(() => Number)
  appliedPrice: number;

  @Field(() => Number)
  lineTotal: number;

  @Field(() => String)
  productSnapshotTitle: string;

  @Field(() => String, { nullable: true })
  productSnapshotThumbnail?: string;

  @Field(() => String, { nullable: true })
  productSnapshotUnit?: string;

  @Field(() => String, { nullable: true })
  productSnapshotSku?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Order {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  orderNo: string;

  @Field(() => String)
  memberId: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @Field(() => Number)
  subtotal: number;

  @Field(() => Number)
  discountAmount: number;

  @Field(() => Number)
  deliveryFee: number;

  @Field(() => Number)
  taxAmount: number;

  @Field(() => Number)
  totalAmount: number;

  @Field(() => String)
  currency: string;

  @Field(() => String)
  addressFullName: string;

  @Field(() => String)
  addressPhone: string;

  @Field(() => String)
  addressLine1: string;

  @Field(() => String, { nullable: true })
  addressLine2?: string;

  @Field(() => String)
  addressCity: string;

  @Field(() => String, { nullable: true })
  addressState?: string;

  @Field(() => String)
  addressPostalCode: string;

  @Field(() => String)
  addressCountry: string;

  @Field(() => String, { nullable: true })
  note?: string;

  @Field(() => Date)
  placedAt: Date;

  @Field(() => Date, { nullable: true })
  canceledAt?: Date;

  @Field(() => Date, { nullable: true })
  deliveredAt?: Date;

  @Field(() => [OrderItem])
  items: OrderItem[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class OrdersByMember {
  @Field(() => [Order])
  list: Order[];

  @Field(() => MetaCounter)
  metaCounter: MetaCounter;
}

@InputType()
export class AddToCartInput {
  @Field(() => String)
  @IsMongoId()
  productId: string;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class UpdateCartItemQtyInput {
  @Field(() => String)
  @IsMongoId()
  cartItemId: string;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class RemoveCartItemInput {
  @Field(() => String)
  @IsMongoId()
  cartItemId: string;
}

@InputType()
export class GetMyOrdersInput {
  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

@InputType()
export class CheckoutAddressInput {
  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @Field(() => String)
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  phone: string;

  @Field(() => String)
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  line1: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  postalCode: string;

  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  country: string;
}

@InputType()
export class CreateOrderFromCartInput {
  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field(() => CheckoutAddressInput)
  address: CheckoutAddressInput;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@InputType()
export class CancelMyOrderInput {
  @Field(() => String)
  @IsMongoId()
  orderId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

@InputType()
export class VendorOrdersInquiryInput {
  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderNo?: string;
}

@ObjectType()
export class VendorOrderItemDTO {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  orderId: string;

  @Field(() => String)
  memberId: string;

  @Field(() => String)
  productId: string;

  @Field(() => String)
  vendorId: string;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Number)
  unitPrice: number;

  @Field(() => Number, { nullable: true })
  salePrice?: number;

  @Field(() => Number)
  appliedPrice: number;

  @Field(() => Number)
  lineTotal: number;

  @Field(() => String)
  productSnapshotTitle: string;

  @Field(() => String, { nullable: true })
  productSnapshotThumbnail?: string;

  @Field(() => String, { nullable: true })
  productSnapshotUnit?: string;

  @Field(() => String, { nullable: true })
  productSnapshotSku?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class VendorOrderDTO {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  orderNo: string;

  @Field(() => String)
  memberId: string;

  @Field(() => String)
  status: string;

  @Field(() => String, { nullable: true })
  paymentMethod?: string;

  @Field(() => String, { nullable: true })
  paymentStatus?: string;

  @Field(() => Number)
  subtotal: number;

  @Field(() => Number)
  discountAmount: number;

  @Field(() => Number)
  deliveryFee: number;

  @Field(() => Number)
  taxAmount: number;

  @Field(() => Number)
  totalAmount: number;

  @Field(() => String)
  currency: string;

  @Field(() => String, { nullable: true })
  addressFullName?: string;

  @Field(() => String, { nullable: true })
  addressPhone?: string;

  @Field(() => String, { nullable: true })
  addressLine1?: string;

  @Field(() => String, { nullable: true })
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  addressCity?: string;

  @Field(() => String, { nullable: true })
  addressState?: string;

  @Field(() => String, { nullable: true })
  addressPostalCode?: string;

  @Field(() => String, { nullable: true })
  addressCountry?: string;

  @Field(() => String, { nullable: true })
  note?: string;

  @Field(() => Date, { nullable: true })
  placedAt?: Date;

  @Field(() => Date, { nullable: true })
  canceledAt?: Date;

  @Field(() => Date, { nullable: true })
  deliveredAt?: Date;

  @Field(() => [VendorOrderItemDTO])
  items: VendorOrderItemDTO[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class VendorOrdersResult {
  @Field(() => [VendorOrderDTO])
  list: VendorOrderDTO[];

  @Field(() => MetaCounter)
  metaCounter: MetaCounter;
}

@InputType()
export class AdminOrdersInquiryInput {
  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsMongoId()
  vendorId?: string;
}

@ObjectType()
export class OrderItemByAdmin {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  orderId: string;

  @Field(() => String)
  productId: string;

  @Field(() => String, { nullable: true })
  vendorId?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Number)
  unitPrice: number;

  @Field(() => Number, { nullable: true })
  salePrice?: number;

  @Field(() => Number)
  appliedPrice: number;

  @Field(() => Number)
  lineTotal: number;

  @Field(() => String)
  productSnapshotTitle: string;

  @Field(() => String, { nullable: true })
  productSnapshotThumbnail?: string;

  @Field(() => String, { nullable: true })
  productSnapshotUnit?: string;

  @Field(() => String, { nullable: true })
  productSnapshotSku?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class OrderByAdmin {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  orderNo: string;

  @Field(() => String)
  memberId: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => String)
  paymentMethod: string;

  @Field(() => String)
  paymentStatus: string;

  @Field(() => Number)
  subtotal: number;

  @Field(() => Number)
  discountAmount: number;

  @Field(() => Number)
  deliveryFee: number;

  @Field(() => Number)
  taxAmount: number;

  @Field(() => Number)
  totalAmount: number;

  @Field(() => String)
  currency: string;

  @Field(() => String)
  addressFullName: string;

  @Field(() => String)
  addressPhone: string;

  @Field(() => String)
  addressLine1: string;

  @Field(() => String, { nullable: true })
  addressLine2?: string;

  @Field(() => String)
  addressCity: string;

  @Field(() => String, { nullable: true })
  addressState?: string;

  @Field(() => String)
  addressPostalCode: string;

  @Field(() => String)
  addressCountry: string;

  @Field(() => String, { nullable: true })
  note?: string;

  @Field(() => Date)
  placedAt: Date;

  @Field(() => Date, { nullable: true })
  canceledAt?: Date;

  @Field(() => Date, { nullable: true })
  deliveredAt?: Date;

  @Field(() => [OrderItemByAdmin])
  items: OrderItemByAdmin[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class OrdersByAdmin {
  @Field(() => [OrderByAdmin])
  list: OrderByAdmin[];

  @Field(() => MetaCounter)
  metaCounter: MetaCounter;
}

@InputType()
export class UpdateOrderStatusByAdminInput {
  @Field(() => String)
  @IsMongoId()
  orderId: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

@InputType()
export class CancelOrderByAdminInput {
  @Field(() => String)
  @IsMongoId()
  orderId: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  reason: string;
}

@InputType()
export class UpdateMyVendorOrderItemStatusInput {
  @Field(() => String)
  @IsMongoId()
  orderId: string;

  @Field(() => String)
  @IsMongoId()
  itemId: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

@ObjectType()
export class VendorOrderItemStatusUpdateOutput {
  @Field(() => String)
  orderId: string;

  @Field(() => String)
  itemId: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Date)
  updatedAt: Date;
}
