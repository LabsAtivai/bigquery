import { Module } from '@nestjs/common';
import { MongoModule } from '../mongo/mongo.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [MongoModule, CampaignsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
