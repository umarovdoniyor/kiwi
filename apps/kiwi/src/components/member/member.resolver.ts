import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => String)
  public async signUp(): Promise<string> {
    console.log('Mutation: signUp');
    return await this.memberService.signUp();
  }

  @Mutation(() => String)
  public async logIn(): Promise<string> {
    console.log('Mutation: logIn');
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
