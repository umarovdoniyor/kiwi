import { Controller, Get } from '@nestjs/common';
import { KiwiBatchService } from './kiwi-batch.service';

@Controller()
export class KiwiBatchController {
  constructor(private readonly kiwiBatchService: KiwiBatchService) {}

  @Get()
  getHello(): string {
    return this.kiwiBatchService.getHello();
  }
}
