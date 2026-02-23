import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberResponse } from '../../libs/dto/member/member';
import { MemberDocument } from '../../libs/dto/member/memberDocument';
import { MemberSignUpInput } from '../../libs/dto/member/member.input';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member')
    private readonly memberModel: Model<MemberDocument>,
  ) {}

  private toMemberResponse(document: MemberDocument): MemberResponse {
    return document as unknown as MemberResponse;
  }

  public async signUp(input: MemberSignUpInput): Promise<MemberResponse> {
    // TODO: Hash password
    try {
      const newMember = await this.memberModel.create(input);
      // TODO: Authentication
      console.log('New member created: ', newMember);
      return this.toMemberResponse(newMember);
    } catch (err) {
      console.log('Error, Service.signUp', err);
      throw new BadRequestException(err);
    }
  }
  public async logIn(): Promise<string> {
    return await Promise.resolve('Log in successful');
  }
  public async updateMember(): Promise<string> {
    return await Promise.resolve('Update member successful');
  }

  public async getMember(): Promise<string> {
    return await Promise.resolve('Get member successful');
  }

  // END of CLASS
}
