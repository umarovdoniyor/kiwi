import { SetMetadata } from '@nestjs/common';
import { MemberType } from '../../../libs/enums/member.enums';

export const ROLES_KEY = 'roles';

/**
 * Attach @Roles decorator to control access by member type
 * @example
 * @Roles(MemberType.ADMIN, MemberType.VENDOR)
 * @Query(() => String)
 * getAdminData(): Promise<string> { ... }
 */
export const Roles = (...roles: MemberType[]) => SetMetadata(ROLES_KEY, roles);
