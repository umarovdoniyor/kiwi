import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MemberService } from './member.service';
import {
  MemberLoginInput,
  MemberSignUpInput,
} from '../../libs/dto/member/member.input';
import {
  MemberByAdmin,
  MemberAuthResponse,
  MembersByAdmin,
  MembersInquiryByAdminInput,
  MemberResponse,
  UpdateMemberStatusByAdminInput,
} from '../../libs/dto/member/member';
import {
  ChangeMemberPasswordInput,
  MemberUpdate,
} from '../../libs/dto/member/member.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enums';
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
  @UseGuards(AuthGuard)
  @Query(() => MemberResponse)
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

  @UseGuards(AuthGuard)
  @Mutation(() => MemberResponse)
  public async updateMember(
    @Args('input') input: MemberUpdate,
    @AuthMember('sub') memberId: string,
  ): Promise<MemberResponse> {
    console.log('Mutation:updateMember');
    return await this.memberService.updateMember(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => MemberResponse)
  public async changeMemberPassword(
    @Args('input') input: ChangeMemberPasswordInput,
    @AuthMember('sub') memberId: string,
  ): Promise<MemberResponse> {
    console.log('Mutation: changeMemberPassword');
    return await this.memberService.changeMemberPassword(memberId, input);
  }

  /** ADMIN */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => MembersByAdmin)
  public async getMembersByAdmin(
    @Args('input') input: MembersInquiryByAdminInput,
  ): Promise<MembersByAdmin> {
    console.log('Query: getMembersByAdmin');
    return await this.memberService.getMembersByAdmin(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => MemberByAdmin)
  public async updateMemberStatusByAdmin(
    @Args('input') input: UpdateMemberStatusByAdminInput,
  ): Promise<MemberByAdmin> {
    console.log('Mutation: updateMemberStatusByAdmin');
    return await this.memberService.updateMemberStatusByAdmin(input);
  }

  // END of CLASS
}
