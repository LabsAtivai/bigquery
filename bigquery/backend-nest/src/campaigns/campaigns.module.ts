import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { MongoModule } from '../mongo/mongo.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MongoModule, ConfigModule.forRoot()],
  providers: [CampaignsService],
  controllers: [CampaignsController],
  exports: [CampaignsService],
})
export class CampaignsModule {}