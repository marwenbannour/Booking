// Point d'entrée serverless Vercel pour l'API NestJS.
// Enveloppe l'app (adaptateur Express) sans `listen`, mise en cache entre les
// invocations à chaud. Les workers Redis/BullMQ sont désactivés en serverless
// (WORKERS_ENABLED=false) — voir app.module.ts / notifications.module.ts.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import express from 'express';
import type { Request, Response } from 'express';
import { AppModule } from '../dist/src/app.module.js';

let cached: express.Express | null = null;

async function bootstrap(): Promise<express.Express> {
  const server = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { rawBody: true },
  );
  const config = app.get(ConfigService);
  const origins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: origins.length ? origins : true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return server;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  if (!cached) {
    cached = await bootstrap();
  }
  cached(req, res);
}
