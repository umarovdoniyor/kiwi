import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberResponse } from '../../libs/dto/member/member';
import { MemberDocument } from '../../libs/dto/member/memberDocument';
import {
  MemberLoginInput,
  MemberSignUpInput,
} from '../../libs/dto/member/member.input';
import { exec } from 'child_process';
import { MemberStatus } from '../../libs/enums/member.enums';
import { Message } from '../../libs/enums/common.enum';

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
  public async logIn(input: MemberLoginInput): Promise<MemberResponse> {
    const { identifier, memberPassword } = input;
    const response = await this.memberModel
      .findOne({
        $or: [
          { memberEmail: identifier },
          { memberPhone: identifier },
          { memberNickname: identifier },
        ],
      })
      .select('+memberPassword')
      .exec();

    if (!response || response.memberStatus === MemberStatus.SUSPENDED) {
      throw new BadRequestException(Message.SUSPENDED_USER);
    } else if (response.memberStatus === MemberStatus.BLOCKED) {
      throw new BadRequestException(Message.BLOCKED_USER);
    }

    // TODO: Compare hashed password
    console.log('response: ', response);
    const isMatch = memberPassword === response.memberPassword;

    if (!isMatch) {
      throw new BadRequestException(Message.WRONG_PASSWORD);
    }

    return this.toMemberResponse(response);
  }

  public async updateMember(): Promise<string> {
    return await Promise.resolve('Update member successful');
  }

  public async getMember(): Promise<string> {
    return await Promise.resolve('Get member successful');
  }

  // END of CLASS
}
