import { Args, Query, Resolver } from '@nestjs/graphql';
import { VendorService } from './vendor.service';
import {
  VendorDetail,
  VendorProductsInquiry,
  VendorsInquiry,
  VendorsPayload,
} from '../../libs/dto/vendor/vendor';
import { ProductPayload } from '../../libs/dto/product/product';

@Resolver()
export class VendorResolver {
  constructor(private readonly vendorService: VendorService) {}

  @Query(() => VendorsPayload)
  public async getVendors(
    @Args('input') input: VendorsInquiry,
  ): Promise<VendorsPayload> {
    console.log('Query: getVendors');
    return await this.vendorService.getVendors(input);
  }

  @Query(() => VendorDetail, { nullable: true })
  public async getVendorBySlug(
    @Args('slug') slug: string,
  ): Promise<VendorDetail | null> {
    console.log('Query: getVendorBySlug');
    return await this.vendorService.getVendorBySlug(slug);
  }

  @Query(() => ProductPayload)
  public async getVendorProducts(
    @Args('vendorId') vendorId: string,
    @Args('input') input: VendorProductsInquiry,
  ): Promise<ProductPayload> {
    console.log('Query: getVendorProducts');
    return await this.vendorService.getVendorProducts(vendorId, input);
  }
}
