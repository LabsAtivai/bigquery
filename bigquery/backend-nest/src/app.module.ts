import { Module } from '@nestjs/common';
import { MongoModule } from './mongo/mongo.module';
import { ImportsModule } from './imports/imports.module';
import { LeadsModule } from './leads/leads.module';
import { CampaignsModule } from './campaigns/campaigns.module';

@Module({
  imports: [MongoModule, ImportsModule, LeadsModule, CampaignsModule],
})
export class AppModule {}
