import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { MongoModule } from '../mongo/mongo.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    CampaignsModule,
    MongoModule,
    ConfigModule.forRoot(),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}