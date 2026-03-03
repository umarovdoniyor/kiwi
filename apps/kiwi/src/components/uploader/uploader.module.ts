import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploaderResolver } from './uploader.resolver';
import { UploaderService } from './uploader.service';

@Module({
  imports: [AuthModule],
  providers: [UploaderResolver, UploaderService],
  exports: [UploaderService],
})
export class UploaderModule {}
