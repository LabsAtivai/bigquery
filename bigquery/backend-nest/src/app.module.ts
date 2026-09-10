import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongoModule } from './mongo/mongo.module';
import { ImportsModule } from './imports/imports.module';
import { LeadsModule } from './leads/leads.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongoModule,
    AuthModule,
    ImportsModule,
    LeadsModule,
    CampaignsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
