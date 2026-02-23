import { NestFactory } from '@nestjs/core';
import { KiwiBatchModule } from './kiwi-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(KiwiBatchModule);
  await app.listen(process.env.PORT_BATCH ?? 3008);
}
bootstrap();
