import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { MongoModule } from '../mongo/mongo.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MongoModule, ConfigModule.forRoot()],
  providers: [ImportsService],
  controllers: [ImportsController],
})
export class ImportsModule {}