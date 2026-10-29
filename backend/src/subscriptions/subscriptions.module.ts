import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service.js';
import { PaymentsService } from './payments.service.js';
import { SubscriptionMaintenanceService } from './subscription-maintenance.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { PaymentsWebhookController } from './payments-webhook.controller.js';

@Module({
  controllers: [SubscriptionsController, PaymentsWebhookController],
  providers: [
    SubscriptionsService,
    PaymentsService,
    SubscriptionMaintenanceService,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
