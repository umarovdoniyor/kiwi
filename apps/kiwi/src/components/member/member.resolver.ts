import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import {
  MemberLoginInput,
  MemberSignUpInput,
} from '../../libs/dto/member/member.input';
import { MemberAuthResponse } from '../../libs/dto/member/member';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => MemberAuthResponse)
  public async signUp(
    @Args('input') input: MemberSignUpInput,
  ): Promise<MemberAuthResponse> {
    console.log('Mutation: signUp');
    return await this.memberService.signUp(input);
  }

  @Mutation(() => MemberAuthResponse)
  public async logIn(
    @Args('input') input: MemberLoginInput,
  ): Promise<MemberAuthResponse> {
    console.log('Mutation: logIn');
    return await this.memberService.logIn(input);
  }

  // Authenticated user
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

  /** ADMIN */

  // Authorized admin only
  @Mutation(() => String)
  public async getAllMembersByAdmin(): Promise<string> {
    console.log('Mutation: getAllMembersByAdmin');
    return await this.memberService.getAllMembersByAdmin();
  }

  @Mutation(() => String)
  public async updateMemberByAdmin(): Promise<string> {
    console.log('Mutation: updateMemberByAdmin');
    return await this.memberService.updateMemberByAdmin();
  }

  // END of CLASS
}
