import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { MongoModule } from '../mongo/mongo.module';

@Module({
  imports: [MongoModule],
  providers: [ImportsService],
  controllers: [ImportsController],
})
export class ImportsModule {}
