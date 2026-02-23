import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<null>,
  ) {}

  public async signUp(): Promise<string> {
    return await Promise.resolve('Sign up successful');
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
