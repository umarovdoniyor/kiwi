import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ApplyVendorInput,
  ReviewVendorApplicationInput,
  VendorApplication,
  VendorApplicationsByAdmin,
  VendorApplicationsInquiryInput,
  VendorApplicationDocument,
} from '../../libs/types/vendor-application';
import {
  VendorApplicationStatus,
  MemberType,
} from '../../libs/enums/member.enums';
import { Message } from '../../libs/enums/common.enum';
import { MemberDocument } from '../../libs/dto/member/memberDocument';

@Injectable()
export class VendorApplicationService {
  constructor(
    @InjectModel('VendorApplication')
    private readonly vendorApplicationModel: Model<VendorApplicationDocument>,
    @InjectModel('Member')
    private readonly memberModel: Model<MemberDocument>,
  ) {}

  private toVendorApplicationResponse(
    doc: VendorApplicationDocument,
  ): VendorApplication {
    return {
      _id: doc._id.toString(),
      memberId: doc.memberId.toString(),
      storeName: doc.storeName,
      description: doc.description,
      businessLicenseUrl: doc.businessLicenseUrl,
      status: doc.status,
      rejectionReason: doc.rejectionReason,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async applyVendor(
    memberId: string,
    input: ApplyVendorInput,
  ): Promise<VendorApplication> {
    try {
      // Check if member already has a pending or approved application
      const existingApplication = await this.vendorApplicationModel
        .findOne({
          memberId,
          status: {
            $in: [
              VendorApplicationStatus.PENDING,
              VendorApplicationStatus.APPROVED,
            ],
          },
        })
        .exec();

      if (existingApplication) {
        if (existingApplication.status === VendorApplicationStatus.APPROVED) {
          throw new BadRequestException(
            'You already have an approved vendor application',
          );
        }
        throw new BadRequestException(
          'You already have a pending vendor application',
        );
      }

      const newApplication = await this.vendorApplicationModel.create({
        memberId,
        ...input,
        status: VendorApplicationStatus.PENDING,
      });

      return this.toVendorApplicationResponse(newApplication);
    } catch (err) {
      console.log('Error, Service.applyVendor', err.message);
      throw new BadRequestException(err.message || Message.CREATE_FAILED);
    }
  }

  public async getMyVendorApplication(
    memberId: string,
  ): Promise<VendorApplication | null> {
    try {
      const application = await this.vendorApplicationModel
        .findOne({ memberId })
        .sort({ createdAt: -1 })
        .exec();

      if (!application) {
        return null;
      }

      return this.toVendorApplicationResponse(application);
    } catch (err) {
      console.log('Error, Service.getMyVendorApplication', err.message);
      throw new BadRequestException(err);
    }
  }

  public async reviewVendorApplication(
    adminId: string,
    input: ReviewVendorApplicationInput,
  ): Promise<VendorApplication> {
    const session = await this.vendorApplicationModel.db.startSession();
    session.startTransaction();

    try {
      const application = await this.vendorApplicationModel
        .findById(input.applicationId)
        .session(session)
        .exec();

      if (!application) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      if (application.status !== VendorApplicationStatus.PENDING) {
        throw new BadRequestException(Message.UPDATE_FAILED);
      }

      if (
        input.status === VendorApplicationStatus.REJECTED &&
        !input.rejectionReason?.trim()
      ) {
        throw new BadRequestException(Message.BAD_REQUEST);
      }

      const member = await this.memberModel
        .findById(application.memberId)
        .session(session)
        .exec();

      if (!member) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      application.status = input.status;
      application.rejectionReason =
        input.status === VendorApplicationStatus.REJECTED
          ? input.rejectionReason?.trim()
          : null;
      application.reviewedBy = adminId;
      application.reviewedAt = new Date();

      await application.save({ session });

      if (input.status === VendorApplicationStatus.APPROVED) {
        if (member.memberType !== MemberType.CUSTOMER) {
          throw new BadRequestException(Message.UPDATE_FAILED);
        }
        member.memberType = MemberType.VENDOR;
        member.vendorProfile = {
          storeName: application.storeName,
          storeDescription: application.description,
          businessLicense: application.businessLicenseUrl,
          taxId: '',
        };
        await member.save({ session });
      }

      await session.commitTransaction();
      return this.toVendorApplicationResponse(application);
    } catch (err) {
      await session.abortTransaction();
      console.log('Error, Service.reviewVendorApplication', err.message);
      throw new BadRequestException(err);
    } finally {
      session.endSession();
    }
  }

  public async getVendorApplicationsByAdmin(
    input: VendorApplicationsInquiryInput,
  ): Promise<VendorApplicationsByAdmin> {
    try {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter: any = {
        ...(input?.status ? { status: input.status } : {}),
      };

      if (input?.search?.trim()) {
        const search = input.search.trim();
        filter.$or = [
          { storeName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { businessLicenseUrl: { $regex: search, $options: 'i' } },
        ];
      }

      const [applications, total] = await Promise.all([
        this.vendorApplicationModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.vendorApplicationModel.countDocuments(filter).exec(),
      ]);

      return {
        list: applications.map((doc) => this.toVendorApplicationResponse(doc)),
        metaCounter: { total },
      };
    } catch (err) {
      console.log('Error, Service.getVendorApplicationsByAdmin', err.message);
      throw new BadRequestException(err.message || Message.BAD_REQUEST);
    }
  }

  // END OF CLASS
}
