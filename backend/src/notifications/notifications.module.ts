import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueuesModule } from '../queues/queues.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { WHATSAPP_PROVIDER } from './notification.constants.js';
import { MockWhatsAppProvider } from './whatsapp/mock-whatsapp.provider.js';
import { MetaWhatsAppProvider } from './whatsapp/meta-whatsapp.provider.js';
import type { WhatsAppProvider } from './whatsapp/whatsapp-provider.interface.js';
import { NotificationsSchedulingService } from './notifications-scheduling.service.js';
import { OutboxRelayService } from './outbox-relay.service.js';
import { NotificationProcessor } from './notification.processor.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsWebhookService } from './notifications-webhook.service.js';
import { NotificationsController } from './notifications.controller.js';
import { WhatsAppWebhooksController } from './webhooks.controller.js';

const whatsappProvider = {
  provide: WHATSAPP_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService): WhatsAppProvider => {
    const kind = (config.get<string>('WHATSAPP_PROVIDER') ?? 'mock').toLowerCase();
    switch (kind) {
      case 'meta':
      case 'cloud':
      case 'whatsapp':
        return new MetaWhatsAppProvider(config);
      case 'mock':
        return new MockWhatsAppProvider(config);
      default:
        throw new Error(`Unknown WHATSAPP_PROVIDER: ${kind}`);
    }
  },
};

// Les composants Redis (relais outbox + worker BullMQ) ne sont enregistrés que
// hors mode serverless. La programmation des notifications (écriture outbox en
// base) reste disponible car purement SQL — les bookings en dépendent.
const workersEnabled = process.env.WORKERS_ENABLED !== 'false';

@Module({
  imports: [...(workersEnabled ? [QueuesModule] : []), SubscriptionsModule],
  controllers: [NotificationsController, WhatsAppWebhooksController],
  providers: [
    whatsappProvider,
    NotificationsSchedulingService,
    ...(workersEnabled ? [OutboxRelayService, NotificationProcessor] : []),
    NotificationsService,
    NotificationsWebhookService,
  ],
  exports: [NotificationsSchedulingService],
})
export class NotificationsModule {}
