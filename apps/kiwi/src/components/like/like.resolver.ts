import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ToggleLikeInput, ToggleLikeResponse } from '../../libs/dto/like/like';

@Resolver()
export class LikeResolver {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => ToggleLikeResponse)
  public async toggleLike(
    @Args('input') input: ToggleLikeInput,
    @AuthMember('sub') memberId: string,
  ): Promise<ToggleLikeResponse> {
    console.log('Mutation: toggleLike');
    return await this.likeService.toggleLike(memberId, input);
  }
}
