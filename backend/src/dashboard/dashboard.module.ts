import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [SubscriptionsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
