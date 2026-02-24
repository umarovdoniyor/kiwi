import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../../../libs/types/common';

@Injectable()
export class WithoutGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.info('--- @guard() Authentication [WithoutGuard] - Optional ---');

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    if ((context.getType() as string) === 'graphql') {
      const request = context.getArgByIndex(2).req;
      const bearerToken = request.headers?.authorization;

      let authMember: JwtPayload | null = null;

      if (bearerToken) {
        // Extract token from "Bearer {token}" format
        const parts = bearerToken.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          const token = parts[1];
          try {
            authMember = await this.authService.verifyToken(token);
          } catch (error) {
            // Token is invalid or expired, but that's OK for optional auth
            console.debug(
              'Optional token verification failed',
              error instanceof Error ? error.message : 'Unknown error',
            );
            authMember = null;
          }
        } else {
          // Invalid Bearer format, treat as no token
          console.debug('Invalid Bearer token format');
          authMember = null;
        }
      }

      // Attach member (null if not authenticated)
      request.body.authMember = authMember;
      console.debug(
        'memberEmail[without] =>',
        authMember?.memberEmail ?? 'none (anonymous)',
      );
      return true;
    }

    // HTTP and other context types return true (allow access)
    return true;
  }
}
