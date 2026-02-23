import { Test, TestingModule } from '@nestjs/testing';
import { KiwiBatchController } from './kiwi-batch.controller';
import { KiwiBatchService } from './kiwi-batch.service';

describe('KiwiBatchController', () => {
  let kiwiBatchController: KiwiBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [KiwiBatchController],
      providers: [KiwiBatchService],
    }).compile();

    kiwiBatchController = app.get<KiwiBatchController>(KiwiBatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(kiwiBatchController.getHello()).toBe('Hello World!');
    });
  });
});
