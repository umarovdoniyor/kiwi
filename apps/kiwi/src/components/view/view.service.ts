import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordViewInput, RecordViewResponse } from '../../libs/dto/view/view';
import { ViewGroup } from '../../libs/enums/view.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enums';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class ViewService {
  constructor(
    @InjectModel('View')
    private readonly viewModel: Model<any>,
    @InjectModel('Product')
    private readonly productModel: Model<any>,
    @InjectModel('Member')
    private readonly memberModel: Model<any>,
  ) {}

  private async validateViewTarget(input: RecordViewInput): Promise<void> {
    switch (input.viewGroup) {
      case ViewGroup.PRODUCT: {
        const productExists = await this.productModel
          .exists({ _id: input.viewRefId, deletedAt: null })
          .exec();
        if (!productExists) {
          throw new BadRequestException(Message.NO_DATA_FOUND);
        }
        break;
      }
      case ViewGroup.MEMBER: {
        const memberExists = await this.memberModel
          .exists({
            _id: input.viewRefId,
            memberStatus: MemberStatus.ACTIVE,
            $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
          })
          .exec();
        if (!memberExists) {
          throw new BadRequestException(Message.NO_DATA_FOUND);
        }
        break;
      }
      case ViewGroup.VENDOR:
      case ViewGroup.SHOP: {
        const vendorExists = await this.memberModel
          .exists({
            _id: input.viewRefId,
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

  private async updateProductViewsCount(productId: string): Promise<void> {
    await this.productModel
      .updateOne({ _id: productId, deletedAt: null }, { $inc: { views: 1 } })
      .exec();
  }

  public async recordView(
    memberId: string,
    input: RecordViewInput,
  ): Promise<RecordViewResponse> {
    try {
      await this.validateViewTarget(input);

      const filter = {
        memberId,
        viewRefId: input.viewRefId,
        viewGroup: input.viewGroup,
      };

      const existingView = await this.viewModel.findOne(filter).exec();

      if (!existingView) {
        await this.viewModel.create(filter);

        if (input.viewGroup === ViewGroup.PRODUCT) {
          await this.updateProductViewsCount(input.viewRefId);
        }
      }

      const totalViews = await this.viewModel
        .countDocuments({
          viewRefId: input.viewRefId,
          viewGroup: input.viewGroup,
        })
        .exec();

      return {
        viewGroup: input.viewGroup,
        viewRefId: input.viewRefId,
        viewed: true,
        totalViews,
      };
    } catch (err) {
      console.log('Error, Service.recordView', err.message);
      if (err?.code === 11000) {
        const totalViews = await this.viewModel
          .countDocuments({
            viewRefId: input.viewRefId,
            viewGroup: input.viewGroup,
          })
          .exec();

        return {
          viewGroup: input.viewGroup,
          viewRefId: input.viewRefId,
          viewed: true,
          totalViews,
        };
      }
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }
}
