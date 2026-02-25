import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Message } from 'apps/kiwi/src/libs/enums/common.enum';
import { JwtPayload } from '../../../libs/types/common';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.info('--- @guard() Authentication [AuthGuard] ---');

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
        throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
      }

      // Attach verified member to request
      request.authMember = authMember;
      if (request.body) {
        request.body.authMember = authMember;
      }
      return true;
    }

    // HTTP and other context types are not supported by this guard
    return false;
  }
}
