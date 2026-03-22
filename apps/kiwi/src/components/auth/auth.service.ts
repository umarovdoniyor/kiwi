import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MemberResponse } from '../../libs/dto/member/member';
import { JwtPayload } from '../../libs/types/common';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  public async hashPassword(memberPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(memberPassword, salt);
  }

  public async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  public async createToken(member: MemberResponse): Promise<string> {
    const payload: JwtPayload = {
      sub: member._id,
      memberEmail: member.memberEmail,
      memberNickname: member.memberNickname,
      memberType: member.memberType,
      memberStatus: member.memberStatus,
    };
    return await this.jwtService.signAsync(payload);
  }

  public async verifyToken(token: string): Promise<JwtPayload> {
    return await this.jwtService.verifyAsync<JwtPayload>(token);
  }
}
