import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason instanceof Error ? reason.stack : reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err.stack);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); // ← adiciona /api/ em todas rotas

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: ['https://bigquery.labsativa.com.br', 'http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap().catch((err) => {
  logger.error('Falha ao iniciar aplicação', err instanceof Error ? err.stack : err);
  process.exit(1);
});
