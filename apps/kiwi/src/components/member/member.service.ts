import {
  BadRequestException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  MemberByAdmin,
  MemberAuthResponse,
  MembersByAdmin,
  MembersInquiryByAdminInput,
  MemberResponse,
  UpdateMemberStatusByAdminInput,
} from '../../libs/dto/member/member';
import { MemberDocument } from '../../libs/dto/member/memberDocument';
import {
  MemberLoginInput,
  MemberSignUpInput,
} from '../../libs/dto/member/member.input';
import { MemberStatus, MemberType } from '../../libs/enums/member.enums';
import { memberStatusToVendorStatus } from '../../libs/enums/vendor.enum';
import { Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import {
  ChangeMemberPasswordInput,
  MemberUpdate,
} from '../../libs/dto/member/member.update';

@Injectable()
export class MemberService implements OnApplicationBootstrap {
  constructor(
    @InjectModel('Member')
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel('Order')
    private readonly orderModel: Model<any>,
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
    const vendorProfile = doc.vendorProfile
      ? {
          _id: doc._id.toString(),
          storeName:
            doc.vendorProfile.storeName || doc.memberNickname || 'Vendor',
          storeDescription: doc.vendorProfile.storeDescription || null,
          coverImageUrl: doc.vendorProfile.coverImageUrl || null,
          category: doc.vendorProfile.category || null,
          minimumOrderQty:
            doc.vendorProfile.minimumOrderQty !== undefined &&
            doc.vendorProfile.minimumOrderQty !== null
              ? Number(doc.vendorProfile.minimumOrderQty)
              : null,
          status: memberStatusToVendorStatus[doc.memberStatus],
        }
      : undefined;

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
      memberDob: doc.memberDob,
      vendorProfile,
      isEmailVerified: doc.isEmailVerified,
      isPhoneVerified: doc.isPhoneVerified,
      lastLoginAt: doc.lastLoginAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private toMemberByAdmin(doc: MemberDocument, ordersCount = 0): MemberByAdmin {
    return {
      _id: doc._id.toString(),
      ordersCount,
      memberEmail: doc.memberEmail,
      memberPhone: doc.memberPhone,
      memberNickname: doc.memberNickname,
      memberFirstName: doc.memberFirstName,
      memberLastName: doc.memberLastName,
      memberAvatar: doc.memberAvatar,
      memberDob: doc.memberDob,
      memberType: doc.memberType,
      memberStatus: doc.memberStatus,
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
      if (input.memberDob) {
        const parsedDob = new Date(input.memberDob);
        if (Number.isNaN(parsedDob.getTime())) {
          throw new BadRequestException('Invalid date of birth format');
        }
        if (parsedDob > new Date()) {
          throw new BadRequestException(
            'Date of birth cannot be in the future',
          );
        }
      }

      const updatePayload: Record<string, unknown> = {
        ...input,
        ...(input.memberEmail
          ? { memberEmail: input.memberEmail.toLowerCase().trim() }
          : {}),
        ...(input.memberDob ? { memberDob: new Date(input.memberDob) } : {}),
      };

      const updatedMember = await this.memberModel
        .findByIdAndUpdate(
          { _id: memberId, memberStatus: MemberStatus.ACTIVE },
          updatePayload,
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

  // ME
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

  public async changeMemberPassword(
    memberId: string,
    input: ChangeMemberPasswordInput,
  ): Promise<MemberResponse> {
    try {
      const member = await this.memberModel
        .findOne({ _id: memberId })
        .select('+memberPassword')
        .exec();

      if (!member) {
        throw new BadRequestException(Message.WRONG_PASSWORD);
      }

      if (member.memberStatus === MemberStatus.SUSPENDED) {
        throw new BadRequestException(Message.SUSPENDED_USER);
      } else if (member.memberStatus === MemberStatus.BLOCKED) {
        throw new BadRequestException(Message.BLOCKED_USER);
      }

      const isMatch = await this.authService.comparePasswords(
        input.currentPassword,
        member.memberPassword,
      );
      if (!isMatch) {
        throw new BadRequestException(Message.WRONG_PASSWORD);
      }

      const hashedNewPassword = await this.authService.hashPassword(
        input.newPassword,
      );
      member.memberPassword = hashedNewPassword;
      await member.save();

      return this.toMemberResponse(member);
    } catch (err) {
      console.log('Error, Service.changeMemberPassword', err.message);
      throw new BadRequestException(err);
    }
  }

  /** ADMIN */
  public async getMembersByAdmin(
    input: MembersInquiryByAdminInput,
  ): Promise<MembersByAdmin> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter: any = {
        ...(input?.status ? { memberStatus: input.status } : {}),
        ...(input?.type ? { memberType: input.type } : {}),
      };

      if (input?.search?.trim()) {
        const search = input.search.trim();
        filter.$or = [
          { memberEmail: { $regex: search, $options: 'i' } },
          { memberPhone: { $regex: search, $options: 'i' } },
          { memberNickname: { $regex: search, $options: 'i' } },
          { memberFirstName: { $regex: search, $options: 'i' } },
          { memberLastName: { $regex: search, $options: 'i' } },
        ];
      }

      const [members, total] = await Promise.all([
        this.memberModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.memberModel.countDocuments(filter).exec(),
      ]);

      const memberIds = members.map((member) => member._id);
      const ordersCountAgg =
        memberIds.length > 0
          ? await this.orderModel
              .aggregate([
                {
                  $match: {
                    memberId: { $in: memberIds },
                  },
                },
                {
                  $group: {
                    _id: '$memberId',
                    count: { $sum: 1 },
                  },
                },
              ])
              .exec()
          : [];

      const ordersCountByMemberId = new Map<string, number>(
        ordersCountAgg.map((entry: any) => [
          entry._id.toString(),
          Number(entry.count || 0),
        ]),
      );

      return {
        list: members.map((member) =>
          this.toMemberByAdmin(
            member,
            ordersCountByMemberId.get(member._id.toString()) || 0,
          ),
        ),
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getMembersByAdmin', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  public async updateMemberStatusByAdmin(
    input: UpdateMemberStatusByAdminInput,
  ): Promise<MemberByAdmin> {
    try {
      const member = await this.memberModel.findById(input.memberId).exec();

      if (!member) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      member.memberStatus = input.status;

      if (input.reason?.trim()) {
        member.memberAddress = member.memberAddress
          ? `${member.memberAddress}\n[ADMIN STATUS NOTE] ${input.reason.trim()}`
          : `[ADMIN STATUS NOTE] ${input.reason.trim()}`;
      }

      await member.save();
      return this.toMemberByAdmin(member);
    } catch (err) {
      console.log('Error, Service.updateMemberStatusByAdmin', err.message);
      throw new BadRequestException(err.message || Message.UPDATE_FAILED);
    }
  }

  // END of CLASS
}
