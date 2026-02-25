import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VendorApplicationService } from './vendor-application.service';
import {
  ApplyVendorInput,
  ReviewVendorApplicationInput,
  VendorApplication,
} from '../../libs/types/vendor-application';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enums';

@Resolver()
export class VendorApplicationResolver {
  constructor(
    private readonly vendorApplicationService: VendorApplicationService,
  ) {}

  @UseGuards(AuthGuard)
  @Mutation(() => VendorApplication)
  public async applyVendor(
    @Args('input') input: ApplyVendorInput,
    @AuthMember('sub') memberId: string,
  ): Promise<VendorApplication> {
    console.log('Mutation: applyVendor');
    return await this.vendorApplicationService.applyVendor(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => VendorApplication, { nullable: true })
  public async getMyVendorApplication(
    @AuthMember('sub') memberId: string,
  ): Promise<VendorApplication | null> {
    console.log('Query: getMyVendorApplication', { memberId });
    return await this.vendorApplicationService.getMyVendorApplication(memberId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => VendorApplication)
  public async reviewVendorApplication(
    @Args('input') input: ReviewVendorApplicationInput,
    @AuthMember('sub') adminId: string,
  ): Promise<VendorApplication> {
    console.log('Mutation: reviewVendorApplication');
    return await this.vendorApplicationService.reviewVendorApplication(
      adminId,
      input,
    );
  }

  // END OF CLASS
}
