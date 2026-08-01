import { join as pathJoin } from 'path';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { swagger_config } from './utils/swagger-config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { static as expressStatic, json as expressJson, urlencoded as expressUrlencoded } from 'express';
import { errorMapper } from './utils/api-error';
import basicAuth = require('express-basic-auth'); // ✅


async function bootstrap() {
  // bodyParser désactivé au niveau Nest pour pouvoir fixer nos propres
  // limites ci-dessous (le body-parser interne de Nest ignorerait sinon
  // ces options, avec sa propre limite par défaut appliquée en premier).
  const app = await NestFactory.create(AppModule, { bodyParser: false });


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

  // ── Fichiers statiques (avatars, pièces jointes...) ────────
  app.use('/public', expressStatic(pathJoin(__dirname, '../public')));

  // ── Body parsers (limite relevée pour les imports en masse) ─
  app.use(expressJson({ limit: '1gb' }));
  app.use(expressUrlencoded({ limit: '1gb', extended: true }));

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
  // Affiché dans tous les environnements, y compris en production —
  // protégé par le basicAuth sur /docs ci-dessus (pas de gate NODE_ENV).
  swagger_config(app);



  const logger = new Logger('Bootstrap');
  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}/docs`);

}

bootstrap();