import {
  BadRequestException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  MemberAuthResponse,
  MemberResponse,
} from '../../libs/dto/member/member';
import { MemberDocument } from '../../libs/dto/member/memberDocument';
import {
  MemberLoginInput,
  MemberSignUpInput,
} from '../../libs/dto/member/member.input';
import { MemberStatus, MemberType } from '../../libs/enums/member.enums';
import { Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';

@Injectable()
export class MemberService implements OnApplicationBootstrap {
  constructor(
    @InjectModel('Member')
    private readonly memberModel: Model<MemberDocument>,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
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

      const hashedPassword: string =
        await this.authService.hashPassword(adminPassword);

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
      memberAvatar: doc.memberAvatar,
      memberType: doc.memberType,
      memberStatus: doc.memberStatus,
      memberAddress: doc.memberAddress,
      isEmailVerified: doc.isEmailVerified,
      isPhoneVerified: doc.isPhoneVerified,
      lastLoginAt: doc.lastLoginAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async signUp(input: MemberSignUpInput): Promise<MemberAuthResponse> {
    const hashedPassword = await this.authService.hashPassword(
      input.memberPassword,
    );
    try {
      const newMember = await this.memberModel.create({
        ...input,
        memberEmail: input.memberEmail.toLowerCase().trim(),
        memberPassword: hashedPassword,
        memberType: MemberType.CUSTOMER,
        lastLoginAt: new Date(),
      });

      const accessToken = await this.authService.createToken(
        this.toMemberResponse(newMember),
      );
      return {
        member: this.toMemberResponse(newMember),
        accessToken,
      };
    } catch (err) {
      console.log('Error, Service.signUp', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
      }
      throw new BadRequestException(err);
    }
  }
  public async logIn(input: MemberLoginInput): Promise<MemberAuthResponse> {
    const { identifier, memberPassword } = input;

    // Normalize identifier for case-insensitive email lookup
    const normalizedIdentifier = identifier.toLowerCase().trim();

    const response = await this.memberModel
      .findOne({
        $or: [
          { memberEmail: normalizedIdentifier },
          { memberPhone: normalizedIdentifier },
          { memberNickname: identifier }, // Keep original case for nickname
        ],
      })
      .select('+memberPassword')
      .exec();

    if (!response) {
      throw new BadRequestException(Message.WRONG_PASSWORD);
    }

    if (response.memberStatus === MemberStatus.SUSPENDED) {
      throw new BadRequestException(Message.SUSPENDED_USER);
    } else if (response.memberStatus === MemberStatus.BLOCKED) {
      throw new BadRequestException(Message.BLOCKED_USER);
    }
    const isMatch = await this.authService.comparePasswords(
      memberPassword,
      response.memberPassword,
    );
    if (!isMatch) {
      throw new BadRequestException(Message.WRONG_PASSWORD);
    }

    const now = new Date(); // Update lastLoginAt timestamp
    response.lastLoginAt = now;
    await this.memberModel.findByIdAndUpdate(response._id, {
      lastLoginAt: now,
    });

    const accessToken = await this.authService.createToken(
      this.toMemberResponse(response),
    );
    return {
      member: this.toMemberResponse(response),
      accessToken,
    };
  }

  public async updateMember(
    memberId: string,
    input: MemberUpdate,
  ): Promise<MemberResponse> {
    try {
      const updatedMember = await this.memberModel
        .findByIdAndUpdate(
          { _id: memberId, memberStatus: MemberStatus.ACTIVE },
          input,
          { new: true },
        )
        .exec();
      if (!updatedMember) {
        throw new BadRequestException(Message.UPDATE_FAILED);
      }
      return this.toMemberResponse(updatedMember);
    } catch (err) {
      console.log('Error, Service.updateMember', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
      }
      throw new BadRequestException(err);
    }
  }

  public async getMember(): Promise<string> {
    return await Promise.resolve('Get member successful');
  }

  public async getMemberById(memberId: string): Promise<MemberResponse> {
    try {
      const member = await this.memberModel.findById(memberId).exec();

      if (!member) {
        throw new BadRequestException(Message.WRONG_PASSWORD);
      }

      if (member.memberStatus === MemberStatus.SUSPENDED) {
        throw new BadRequestException(Message.SUSPENDED_USER);
      } else if (member.memberStatus === MemberStatus.BLOCKED) {
        throw new BadRequestException(Message.BLOCKED_USER);
      }

      // const accessToken = await this.authService.createToken(
      //   this.toMemberResponse(member),
      // );

      return this.toMemberResponse(member);
    } catch (err) {
      console.log('Error, Service.getMemberById', err.message);
      throw new BadRequestException(err);
    }
  }

  public async getMemberProfile(memberId: string): Promise<MemberResponse> {
    try {
      const member = await this.memberModel.findById(memberId).exec();

      if (!member) {
        throw new BadRequestException(Message.WRONG_PASSWORD);
      }

      if (
        member.memberStatus === MemberStatus.SUSPENDED ||
        member.memberStatus === MemberStatus.BLOCKED
      ) {
        throw new BadRequestException('Member profile not accessible');
      }

      return this.toMemberResponse(member);
    } catch (err) {
      console.log('Error, Service.getMemberProfile', err.message);
      throw new BadRequestException(err);
    }
  }

  /** ADMIN */
  public async getAllMembersByAdmin(): Promise<string> {
    return await Promise.resolve('Get all members by admin successful');
  }

  public async updateMemberByAdmin(): Promise<string> {
    return await Promise.resolve('Update member by admin successful');
  }

  // END of CLASS
}
