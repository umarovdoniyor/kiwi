import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../../libs/types/common';

export const AuthMember = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    let request: any;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    if ((context.getType() as string) === 'graphql') {
      request = context.getArgByIndex(2).req;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    else if ((context.getType() as string) === 'http') {
      request = context.switchToHttp().getRequest();
    } else {
      return null;
    }

    const authMember: JwtPayload | null =
      request.authMember || request.body?.authMember || null;

    if (!authMember) {
      return null;
    }

    // Return specific field if requested, otherwise return entire member
    return data ? authMember[data as keyof JwtPayload] : authMember;
  },
);
