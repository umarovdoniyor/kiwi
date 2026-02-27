import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ViewService } from './view.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { RecordViewInput, RecordViewResponse } from '../../libs/dto/view/view';

@Resolver()
export class ViewResolver {
  constructor(private readonly viewService: ViewService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => RecordViewResponse)
  public async recordView(
    @Args('input') input: RecordViewInput,
    @AuthMember('sub') memberId: string,
  ): Promise<RecordViewResponse> {
    console.log('Mutation: recordView');
    return await this.viewService.recordView(memberId, input);
  }
}
