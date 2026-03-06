import { registerEnumType } from '@nestjs/graphql';
import { MemberStatus } from './member.enums';

export enum VendorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum VendorSortBy {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  NAME_ASC = 'NAME_ASC',
  NAME_DESC = 'NAME_DESC',
  POPULAR = 'POPULAR',
}

registerEnumType(VendorStatus, { name: 'VendorStatus' });
registerEnumType(VendorSortBy, { name: 'VendorSortBy' });

export const vendorStatusToMemberStatus: Record<VendorStatus, MemberStatus> = {
  [VendorStatus.ACTIVE]: MemberStatus.ACTIVE,
  [VendorStatus.INACTIVE]: MemberStatus.BLOCKED,
  [VendorStatus.SUSPENDED]: MemberStatus.SUSPENDED,
};

export const memberStatusToVendorStatus: Record<MemberStatus, VendorStatus> = {
  [MemberStatus.ACTIVE]: VendorStatus.ACTIVE,
  [MemberStatus.BLOCKED]: VendorStatus.INACTIVE,
  [MemberStatus.SUSPENDED]: VendorStatus.SUSPENDED,
};
