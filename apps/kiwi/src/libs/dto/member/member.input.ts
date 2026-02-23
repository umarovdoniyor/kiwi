import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

@InputType()
export class MemberSignUpInput {
  @Field(() => String)
  @IsEmail()
  memberEmail: string;

  @Field(() => String)
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  memberPassword: string;

  @Field(() => String)
  @IsString()
  @MinLength(3, { message: 'Nickname must be at least 3 characters' })
  memberNickname: string;

  @Field(() => String)
  @IsString()
  memberFirstName: string;

  @Field(() => String)
  @IsString()
  memberLastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone format' })
  memberPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  memberAddress?: string;
}

@InputType()
export class MemberLoginInput {
  @Field()
  @IsNotEmpty({ message: 'Email or phone is required' })
  @IsString()
  identifier: string; // Can be email or phone number or nickname

  @Field()
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  memberPassword: string;
}
