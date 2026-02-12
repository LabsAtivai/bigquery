import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 3000);

  app.enableCors({
    origin: ['http://localhost:5173', '*'],  // wildcard para dev, remova em prod
    credentials: true,
  });

  await app.listen(port);
  console.log(`Backend rodando em port ${port}`);
}
bootstrap();