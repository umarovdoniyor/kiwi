import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  MemberLoginInput,
  MemberSignUpInput,
} from '../../libs/dto/member/member.input';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => String)
  @UsePipes(ValidationPipe)
  public async signUp(
    @Args('input') input: MemberSignUpInput,
  ): Promise<string> {
    console.log('Mutation: signUp');
    console.log('input: ', input);
    return await this.memberService.signUp();
  }

  @Mutation(() => String)
  @UsePipes(ValidationPipe)
  public async logIn(@Args('input') input: MemberLoginInput): Promise<string> {
    console.log('Mutation: logIn');
    console.log('input: ', input);
    return await this.memberService.logIn();
  }

  @Mutation(() => String)
  public async updateMember(): Promise<string> {
    console.log('Mutation: updateMember');
    return await this.memberService.updateMember();
  }

  @Query(() => String)
  public async getMember(): Promise<string> {
    console.log('Query: getMember');
    return await this.memberService.getMember();
  }

  // END of CLASS
}
