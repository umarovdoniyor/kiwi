import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

@InputType()
export class MemberUpdate {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nickname must be at least 3 characters' })
  memberNickname?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  memberFirstName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  memberLastName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone format' })
  memberPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  memberAvatar?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  memberAddress?: string;
}

@InputType()
export class ChangeMemberPasswordInput {
  @Field(() => String)
  @IsString()
  currentPassword: string;

  @Field(() => String)
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword: string;
}