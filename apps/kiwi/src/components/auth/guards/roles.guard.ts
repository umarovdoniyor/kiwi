import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { Message } from 'apps/kiwi/src/libs/enums/common.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { MemberType } from '../../../libs/enums/member.enums';
import { JwtPayload } from '../../../libs/types/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<MemberType[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // No roles required, allow access
    if (!roles || roles.length === 0) {
      return true;
    }

    console.info(
      `--- @guard() Authorization [RolesGuard]: Allowed roles: ${roles.join(', ')} ---`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    if ((context.getType() as string) === 'graphql') {
      const request = context.getArgByIndex(2).req;
      const bearerToken = request.headers?.authorization;

      if (!bearerToken) {
        throw new BadRequestException(Message.TOKEN_NOT_EXIST);
      }

      // Extract token from "Bearer {token}" format
      const parts = bearerToken.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new BadRequestException('Invalid Bearer token format');
      }

      const token = parts[1];
      let authMember: JwtPayload;

      try {
        authMember = await this.authService.verifyToken(token);
      } catch {
        throw new ForbiddenException(Message.NOT_AUTHENTICATED);
      }

      // Check if user has required role
      const hasRequiredRole = roles.includes(
        authMember.memberType as MemberType,
      );
      if (!hasRequiredRole) {
        throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
      }

      // Attach verified member to request
      request.body.authMember = authMember;
      return true;
    }

    // HTTP and other context types are not supported by this guard
    return false;
  }
}
