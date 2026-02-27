import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsMongoId } from 'class-validator';
import { ViewGroup } from '../../enums/view.enum';

@InputType()
export class RecordViewInput {
  @Field(() => ViewGroup)
  @IsEnum(ViewGroup)
  viewGroup: ViewGroup;

  @Field(() => String)
  @IsMongoId()
  viewRefId: string;
}

@ObjectType()
export class RecordViewResponse {
  @Field(() => ViewGroup)
  viewGroup: ViewGroup;

  @Field(() => ID)
  viewRefId: string;

  @Field(() => Boolean)
  viewed: boolean;

  @Field(() => Int)
  totalViews: number;
}
