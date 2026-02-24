import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MemberService } from './member.service';
import {
  MemberLoginInput,
  MemberSignUpInput,
} from '../../libs/dto/member/member.input';
import {
  MemberAuthResponse,
  MemberResponse,
} from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { JwtPayload } from '../../libs/types/common';

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

  // Session restoration - JWT protected
  @Query(() => MemberResponse)
  @UseGuards(AuthGuard)
  public async me(@AuthMember() member: JwtPayload): Promise<MemberResponse> {
    console.log('Query: me - Restoring session for:', member.memberEmail);
    return await this.memberService.getMemberById(member.sub);
  }

  // Public member profile - anyone can view
  @Query(() => MemberResponse)
  public async getMemberProfile(
    @Args('memberId') memberId: string,
  ): Promise<MemberResponse> {
    console.log('Query: getMemberProfile - Fetching profile for:', memberId);
    return await this.memberService.getMemberProfile(memberId);
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
