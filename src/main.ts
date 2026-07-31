import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { swagger_config } from './utils/swagger-config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { errorMapper } from './utils/api-error';
import basicAuth = require('express-basic-auth'); // ✅


async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // ── CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 'Authorization',
      'api-key', 'fg-pass',
      process.env.API_KEY_HEADER_NAME ?? 'api-key',
    ],
    credentials: true,
  });

  // ── Validation globale (class-validator) ──────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      exceptionFactory: errorMapper,
    }),
  );


  app.use(
    ['/docs'],
    basicAuth({
      challenge: true,
      users: {
        [process.env.DOC_USER_NAME as string]: process.env.DOC_PASSWORD as string,
      },
    }),
  );

  // ── Swagger ───────────────────────────────────────────────
  // if (process.env.NODE_ENV !== 'production') {
  //   swagger_config(app);
  // }

  swagger_config(app);



  const logger = new Logger('Bootstrap');
  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}/docs`);

}

bootstrap();