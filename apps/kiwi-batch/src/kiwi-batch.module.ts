import { Module } from '@nestjs/common';
import { KiwiBatchController } from './kiwi-batch.controller';
import { KiwiBatchService } from './kiwi-batch.service';

@Module({
  imports: [],
  controllers: [KiwiBatchController],
  providers: [KiwiBatchService],
})
export class KiwiBatchModule {}
