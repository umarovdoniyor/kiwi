import { Module } from '@nestjs/common';
import { KiwiBatchController } from './kiwi-batch.controller';
import { KiwiBatchService } from './kiwi-batch.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [KiwiBatchController],
  providers: [KiwiBatchService],
})
export class KiwiBatchModule {}
