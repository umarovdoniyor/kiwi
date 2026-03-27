import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import graphqlUploadExpress from 'graphql-upload/public/graphqlUploadExpress.js';
import express from 'express';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : true;
  app.enableCors({ origin: allowedOrigins, credentials: true });

  app.use(graphqlUploadExpress({ maxFileSize: 15_000_000, maxFiles: 10 }));
  app.use('/uploads', express.static('./uploads'));

  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(process.env.PORT_API ?? 3007);
}
void bootstrap();
