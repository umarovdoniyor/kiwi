import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsMongoId } from 'class-validator';
import { LikeGroup } from '../../enums/like.enum';

@InputType()
export class ToggleLikeInput {
  @Field(() => LikeGroup)
  @IsEnum(LikeGroup)
  likeGroup: LikeGroup;

  @Field(() => String)
  @IsMongoId()
  likeRefId: string;
}

@ObjectType()
export class ToggleLikeResponse {
  @Field(() => LikeGroup)
  likeGroup: LikeGroup;

  @Field(() => ID)
  likeRefId: string;

  @Field(() => Boolean)
  liked: boolean;

  @Field(() => Int)
  totalLikes: number;
}
