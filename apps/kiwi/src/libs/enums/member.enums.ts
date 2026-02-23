import { registerEnumType } from '@nestjs/graphql';

export enum MemberType {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
}

registerEnumType(MemberType, { name: 'MemberType' });

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  SUSPENDED = 'SUSPENDED',
}

registerEnumType(MemberStatus, { name: 'MemberStatus' });

export enum VendorApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(VendorApplicationStatus, { name: 'VendorApplicationStatus' });
