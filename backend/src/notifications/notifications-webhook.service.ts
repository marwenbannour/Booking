import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { WHATSAPP_PROVIDER } from './notification.constants.js';
import type { WhatsAppProvider } from './whatsapp/whatsapp-provider.interface.js';

/**
 * Applies WhatsApp delivery webhook updates to notification jobs and records a
 * log entry for each. A booking is never considered "delivered" on the basis
 * of the send response alone — only an authenticated delivery webhook advances
 * a job to DELIVERED.
 */
@Injectable()
export class NotificationsWebhookService {
  private readonly logger = new Logger(NotificationsWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsAppProvider,
  ) {}

  async applyDeliveryWebhook(payload: unknown): Promise<number> {
    const statuses = this.provider.parseDeliveryStatuses(payload);
    let applied = 0;

    for (const status of statuses) {
      const job = await this.prisma.notificationJob.findFirst({
        where: { providerMessageId: status.providerMessageId },
        select: { id: true, establishmentId: true, eventType: true, status: true },
      });
      if (!job) {
        this.logger.warn(
          `Delivery webhook for unknown message ${status.providerMessageId}`,
        );
        continue;
      }

      const nextStatus =
        status.status === 'DELIVERED'
          ? 'DELIVERED'
          : status.status === 'FAILED'
            ? 'FAILED'
            : job.status;

      await this.prisma.$transaction([
        this.prisma.notificationJob.update({
          where: { id: job.id },
          data: {
            status: nextStatus,
            errorCode:
              status.status === 'FAILED'
                ? (status.errorCode ?? 'WHATSAPP_DELIVERY_FAILED')
                : undefined,
          },
        }),
        this.prisma.notificationLog.create({
          data: {
            establishmentId: job.establishmentId,
            notificationJobId: job.id,
            channel: 'WHATSAPP',
            provider: this.provider.name,
            eventType: job.eventType,
            status:
              status.status === 'DELIVERED'
                ? 'DELIVERED'
                : status.status === 'FAILED'
                  ? 'FAILED'
                  : 'UNKNOWN',
            providerMessageId: status.providerMessageId,
            errorCode: status.errorCode,
            errorMessage: status.errorMessage,
            detail: { source: 'webhook' },
          },
        }),
      ]);
      applied += 1;
    }

    return applied;
  }
}
