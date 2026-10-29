import { Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service.js';
import { BOOKING_NOTIFICATIONS_QUEUE } from '../queues/queues.module.js';
import {
  WHATSAPP_PROVIDER,
  type DispatchJobData,
  type NotificationEventType,
} from './notification.constants.js';
import type { WhatsAppProvider } from './whatsapp/whatsapp-provider.interface.js';
import { WhatsAppPermanentError } from './whatsapp/whatsapp.errors.js';
import { buildBookingMessage } from './messages/message-builder.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

/**
 * Consumes dispatch jobs from the notifications queue and sends the message via
 * the configured WhatsApp provider. Every attempt re-validates the booking
 * (it may have been cancelled or rescheduled since scheduling), honours the
 * customer's consent and the establishment settings, and records a
 * NotificationLog. Transient provider failures are retried by BullMQ; permanent
 * failures are recorded and not retried.
 */
@Processor(BOOKING_NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsAppProvider,
    private readonly subscriptions: SubscriptionsService,
  ) {
    super();
  }

  async process(job: Job<DispatchJobData>): Promise<void> {
    const notificationJobId = job.data.notificationJobId;
    const record = await this.prisma.notificationJob.findUnique({
      where: { id: notificationJobId },
      include: {
        booking: {
          select: {
            status: true,
            startsAt: true,
            publicReference: true,
            customerNameSnapshot: true,
            customerPhoneSnapshot: true,
            serviceNameSnapshot: true,
            cancellationReason: true,
            remindersConsent: true,
          },
        },
        establishment: {
          select: { name: true, locale: true, timezone: true },
        },
      },
    });

    if (!record) {
      this.logger.warn(`Notification job ${notificationJobId} no longer exists`);
      return;
    }

    // Already handled (deduped delivery) or cancelled before dispatch.
    if (['SENT', 'DELIVERED', 'CANCELLED'].includes(record.status)) {
      return;
    }

    const eventType = record.eventType as NotificationEventType;
    const booking = record.booking;

    // Consent and settings gate every outbound message.
    if (!booking.remindersConsent) {
      await this.finalizeSkipped(
        record.id,
        record.establishmentId,
        eventType,
        'CONSENT_WITHDRAWN',
      );
      return;
    }
    const settings = await this.prisma.notificationSetting.findUnique({
      where: { establishmentId: record.establishmentId },
      select: { whatsappEnabled: true },
    });
    if (settings && !settings.whatsappEnabled) {
      await this.finalizeSkipped(
        record.id,
        record.establishmentId,
        eventType,
        'WHATSAPP_DISABLED',
      );
      return;
    }

    // Event-specific validity: a booking that is no longer active must not
    // trigger a confirmation/reminder; a cancellation notice requires the
    // booking to actually be cancelled.
    if (
      eventType === 'BOOKING_CONFIRMED' ||
      eventType === 'BOOKING_REMINDER_DUE'
    ) {
      if (booking.status !== 'CONFIRMED') {
        await this.finalizeSkipped(
          record.id,
          record.establishmentId,
          eventType,
          'BOOKING_NOT_ACTIVE',
        );
        return;
      }
      if (booking.startsAt.getTime() <= Date.now()) {
        await this.finalizeSkipped(
          record.id,
          record.establishmentId,
          eventType,
          'BOOKING_IN_PAST',
        );
        return;
      }
    }
    if (eventType === 'BOOKING_CANCELLED' && booking.status !== 'CANCELLED') {
      await this.finalizeSkipped(
        record.id,
        record.establishmentId,
        eventType,
        'BOOKING_NOT_CANCELLED',
      );
      return;
    }

    // Monthly notification quota: skip sending once the plan limit is reached.
    if (await this.subscriptions.isNotificationQuotaExceeded(record.establishmentId)) {
      await this.finalizeSkipped(
        record.id,
        record.establishmentId,
        eventType,
        'NOTIFICATION_QUOTA_EXCEEDED',
      );
      return;
    }

    const recipient = booking.customerPhoneSnapshot;
    if (!recipient) {
      await this.finalizeFailed(
        record.id,
        record.establishmentId,
        eventType,
        null,
        'NO_RECIPIENT',
        'Booking has no phone number to notify',
      );
      return;
    }

    await this.prisma.notificationJob.update({
      where: { id: record.id },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
        leaseUntil: new Date(Date.now() + 60_000),
      },
    });

    const message = buildBookingMessage(eventType, {
      locale: record.establishment.locale,
      timezone: record.establishment.timezone,
      establishmentName: record.establishment.name,
      customerName: booking.customerNameSnapshot,
      serviceName: booking.serviceNameSnapshot,
      startsAt: booking.startsAt,
      publicReference: booking.publicReference,
      cancellationReason: booking.cancellationReason,
    });

    try {
      const result = await this.provider.sendTemplateMessage({
        to: recipient,
        templateName: message.templateName,
        languageCode: message.languageCode,
        bodyParameters: message.bodyParameters,
        previewText: message.previewText,
      });

      await this.prisma.$transaction([
        this.prisma.notificationJob.update({
          where: { id: record.id },
          data: {
            status: 'SENT',
            providerMessageId: result.providerMessageId,
            errorCode: null,
            leaseUntil: null,
          },
        }),
        this.prisma.notificationLog.create({
          data: {
            establishmentId: record.establishmentId,
            notificationJobId: record.id,
            channel: 'WHATSAPP',
            provider: this.provider.name,
            eventType,
            status: 'SENT',
            recipient,
            providerMessageId: result.providerMessageId,
            detail: { preview: message.previewText },
          },
        }),
      ]);
    } catch (error) {
      const permanent = error instanceof WhatsAppPermanentError;
      const code =
        (error as { code?: string }).code ??
        (permanent ? 'WHATSAPP_PERMANENT_ERROR' : 'WHATSAPP_TRANSIENT_ERROR');
      const maxAttempts = job.opts.attempts ?? 1;
      const isLastAttempt = job.attemptsMade + 1 >= maxAttempts;

      await this.finalizeFailed(
        record.id,
        record.establishmentId,
        eventType,
        recipient,
        code,
        (error as Error).message,
        permanent || isLastAttempt ? 'FAILED' : 'PENDING',
      );

      // Retry transient failures until BullMQ exhausts the attempt budget.
      if (!permanent && !isLastAttempt) {
        throw error;
      }
    }
  }

  private async finalizeSkipped(
    notificationJobId: string,
    establishmentId: string,
    eventType: NotificationEventType,
    reason: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.notificationJob.update({
        where: { id: notificationJobId },
        data: { status: 'CANCELLED', errorCode: reason, leaseUntil: null },
      }),
      this.prisma.notificationLog.create({
        data: {
          establishmentId,
          notificationJobId,
          channel: 'WHATSAPP',
          provider: this.provider.name,
          eventType,
          status: 'CANCELLED',
          errorCode: reason,
        },
      }),
    ]);
  }

  private async finalizeFailed(
    notificationJobId: string,
    establishmentId: string,
    eventType: NotificationEventType,
    recipient: string | null,
    code: string,
    errorMessage: string,
    jobStatus: 'FAILED' | 'PENDING' = 'FAILED',
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.notificationJob.update({
        where: { id: notificationJobId },
        data: {
          status: jobStatus,
          errorCode: code,
          leaseUntil: null,
        },
      }),
      this.prisma.notificationLog.create({
        data: {
          establishmentId,
          notificationJobId,
          channel: 'WHATSAPP',
          provider: this.provider.name,
          eventType,
          status: 'FAILED',
          recipient,
          errorCode: code,
          errorMessage,
        },
      }),
    ]);
  }
}
