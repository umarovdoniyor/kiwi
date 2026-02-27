import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ToggleLikeInput, ToggleLikeResponse } from '../../libs/dto/like/like';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enums';

@Injectable()
export class LikeService {
  constructor(
    @InjectModel('Like')
    private readonly likeModel: Model<any>,
    @InjectModel('Product')
    private readonly productModel: Model<any>,
    @InjectModel('Member')
    private readonly memberModel: Model<any>,
  ) {}

  private async validateLikeTarget(input: ToggleLikeInput): Promise<void> {
    switch (input.likeGroup) {
      case LikeGroup.PRODUCT: {
        const productExists = await this.productModel
          .exists({ _id: input.likeRefId, deletedAt: null })
          .exec();
        if (!productExists) {
          throw new BadRequestException(Message.NO_DATA_FOUND);
        }
        break;
      }
      case LikeGroup.MEMBER: {
        const memberExists = await this.memberModel
          .exists({
            _id: input.likeRefId,
            memberStatus: MemberStatus.ACTIVE,
            $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
          })
          .exec();
        if (!memberExists) {
          throw new BadRequestException(Message.NO_DATA_FOUND);
        }
        break;
      }
      case LikeGroup.VENDOR:
      case LikeGroup.SHOP: {
        const vendorExists = await this.memberModel
          .exists({
            _id: input.likeRefId,
            memberType: MemberType.VENDOR,
            memberStatus: MemberStatus.ACTIVE,
            vendorProfile: { $exists: true, $ne: null },
            $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
          })
          .exec();
        if (!vendorExists) {
          throw new BadRequestException(Message.NO_DATA_FOUND);
        }
        break;
      }
      default:
        throw new BadRequestException(Message.BAD_REQUEST);
    }
  }

  private async updateProductLikesCount(
    productId: string,
    delta: number,
  ): Promise<void> {
    if (delta > 0) {
      await this.productModel
        .updateOne({ _id: productId, deletedAt: null }, { $inc: { likes: 1 } })
        .exec();
      return;
    }

    await this.productModel
      .updateOne(
        { _id: productId, deletedAt: null, likes: { $gt: 0 } },
        { $inc: { likes: -1 } },
      )
      .exec();
  }

  public async toggleLike(
    memberId: string,
    input: ToggleLikeInput,
  ): Promise<ToggleLikeResponse> {
    try {
      await this.validateLikeTarget(input);

      const likeFilter = {
        memberId,
        likeRefId: input.likeRefId,
        likeGroup: input.likeGroup,
      };

      const deletedLike = await this.likeModel
        .findOneAndDelete(likeFilter)
        .exec();

      let liked = false;

      if (deletedLike) {
        liked = false;

        if (input.likeGroup === LikeGroup.PRODUCT) {
          await this.updateProductLikesCount(input.likeRefId, -1);
        }
      } else {
        let created = false;

        try {
          await this.likeModel.create({
            memberId,
            likeRefId: input.likeRefId,
            likeGroup: input.likeGroup,
          });
          created = true;
        } catch (err) {
          if (err?.code !== 11000) {
            throw err;
          }
        }

        liked = true;

        if (created && input.likeGroup === LikeGroup.PRODUCT) {
          await this.updateProductLikesCount(input.likeRefId, 1);
        }
      }

      const totalLikes = await this.likeModel
        .countDocuments({
          likeRefId: input.likeRefId,
          likeGroup: input.likeGroup,
        })
        .exec();

      return {
        likeGroup: input.likeGroup,
        likeRefId: input.likeRefId,
        liked,
        totalLikes,
      };
    } catch (err) {
      console.log('Error, Service.toggleLike', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException(Message.BAD_REQUEST);
      }
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }
}
