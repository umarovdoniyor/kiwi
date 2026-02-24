import {
  BadRequestException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { MemberResponse } from '../../libs/dto/member/member';
import { MemberDocument } from '../../libs/dto/member/memberDocument';
import {
  MemberLoginInput,
  MemberSignUpInput,
} from '../../libs/dto/member/member.input';
import { MemberStatus, MemberType } from '../../libs/enums/member.enums';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class MemberService implements OnApplicationBootstrap {
  constructor(
    @InjectModel('Member')
    private readonly memberModel: Model<MemberDocument>,
    private readonly configService: ConfigService,
  ) {}
  async onApplicationBootstrap() {
    await this.createAdminIfNotExists();
  }
  private async createAdminIfNotExists() {
    try {
      const existingAdmin = await this.memberModel.exists({
        memberType: MemberType.ADMIN,
      });

      if (existingAdmin) {
        console.log('✅ Admin already exists');
        return;
      }

      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
      const adminNickname = this.configService.get<string>('ADMIN_NICKNAME');
      const adminFirstName = this.configService.get<string>('ADMIN_FIRSTNAME');
      const adminLastName = this.configService.get<string>('ADMIN_LASTNAME');

      if (!adminEmail || !adminPassword) {
        console.warn('⚠️ Admin credentials missing in .env');
        return;
      }

      const hashedPassword: string = await bcrypt.hash(adminPassword, 10);

      await this.memberModel.create({
        memberEmail: adminEmail.toLowerCase(),
        memberPassword: hashedPassword,
        memberNickname: adminNickname,
        memberFirstName: adminFirstName,
        memberLastName: adminLastName,
        memberType: MemberType.ADMIN,
        isEmailVerified: true,
        isPhoneVerified: true,
      });

      console.log('🚀 Default Admin Created Successfully');
    } catch (error) {
      console.error('❌ Admin initialization failed:', error);
    }
  }

  private toMemberResponse(doc: MemberDocument): MemberResponse {
    return {
      _id: doc._id.toString(),
      memberEmail: doc.memberEmail,
      memberNickname: doc.memberNickname,
      memberPhone: doc.memberPhone,
      memberFirstName: doc.memberFirstName,
      memberLastName: doc.memberLastName,
      memberType: doc.memberType,
      memberStatus: doc.memberStatus,
      isEmailVerified: doc.isEmailVerified,
      isPhoneVerified: doc.isPhoneVerified,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async signUp(input: MemberSignUpInput): Promise<MemberResponse> {
    // TODO: Hash password
    try {
      const newMember = await this.memberModel.create(input);
      // TODO: Authentication
      console.log('New member created: ', newMember);
      // return this.toMemberResponse(newMember);
      return this.toMemberResponse(newMember);
    } catch (err) {
      console.log('Error, Service.signUp', err.message);
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

    // return this.toMemberResponse(response);
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
