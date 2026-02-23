import { Injectable } from '@nestjs/common';

@Injectable()
export class KiwiBatchService {
  getHello(): string {
    return 'Welcome to Kiwi Batch Server!';
  }
}
