import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  AddToWishlistInput,
  AddToWishlistOutput,
  GetMyWishlistInput,
  GetMyWishlistOutput,
  GetWishlistStatusInput,
  GetWishlistStatusOutput,
  RemoveFromWishlistInput,
  RemoveFromWishlistOutput,
} from '../../libs/dto/wishlist/wishlist';
import { WishlistService } from './wishlist.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class WishlistResolver {
  constructor(private readonly wishlistService: WishlistService) {}

  @UseGuards(AuthGuard)
  @Query(() => GetMyWishlistOutput)
  public async getMyWishlist(
    @AuthMember('sub') memberId: string,
    @Args('input') input: GetMyWishlistInput,
  ): Promise<GetMyWishlistOutput> {
    console.log('Query: getMyWishlist');
    return this.wishlistService.getMyWishlist(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => GetWishlistStatusOutput)
  public async getWishlistStatus(
    @AuthMember('sub') memberId: string,
    @Args('input') input: GetWishlistStatusInput,
  ): Promise<GetWishlistStatusOutput> {
    console.log('Query: getWishlistStatus');
    return this.wishlistService.getWishlistStatus(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => AddToWishlistOutput)
  public async addToWishlist(
    @AuthMember('sub') memberId: string,
    @Args('input') input: AddToWishlistInput,
  ): Promise<AddToWishlistOutput> {
    console.log('Mutation: addToWishlist');
    return this.wishlistService.addToWishlist(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => RemoveFromWishlistOutput)
  public async removeFromWishlist(
    @AuthMember('sub') memberId: string,
    @Args('input') input: RemoveFromWishlistInput,
  ): Promise<RemoveFromWishlistOutput> {
    console.log('Mutation: removeFromWishlist');
    return this.wishlistService.removeFromWishlist(memberId, input);
  }
}
