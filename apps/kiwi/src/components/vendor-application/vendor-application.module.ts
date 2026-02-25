import { Module } from '@nestjs/common';
import { VendorApplicationService } from './vendor-application.service';
import { VendorApplicationResolver } from './vendor-application.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorApplicationSchema } from '../../schemas/VendorApplication.model';
import { MemberSchema } from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'VendorApplication', schema: VendorApplicationSchema },
      { name: 'Member', schema: MemberSchema },
    ]),
  ],
  providers: [VendorApplicationService, VendorApplicationResolver],
  exports: [VendorApplicationService],
})
export class VendorApplicationModule {}
