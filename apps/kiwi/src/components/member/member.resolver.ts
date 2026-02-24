import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { InternalServerErrorException } from '@nestjs/common';
import {
  MemberLoginInput,
  MemberSignUpInput,
} from '../../libs/dto/member/member.input';
import { MemberResponse } from '../../libs/dto/member/member';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => MemberResponse)
  public async signUp(
    @Args('input') input: MemberSignUpInput,
  ): Promise<MemberResponse> {
    try {
      console.log('Mutation: signUp');
      console.log('input: ', input);
      return await this.memberService.signUp(input);
    } catch (err) {
      console.log('Erro, signUp', err);
      throw new InternalServerErrorException(err);
    }
  }

  @Mutation(() => MemberResponse)
  public async logIn(
    @Args('input') input: MemberLoginInput,
  ): Promise<MemberResponse> {
    try {
      console.log('Mutation: logIn');
      console.log('input: ', input);
      return await this.memberService.logIn(input);
    } catch (err) {
      console.log('Error, logIn', err);
      throw new InternalServerErrorException(err);
    }
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
