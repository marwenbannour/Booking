import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { NotificationEventType } from './notification.constants.js';

export interface SchedulableBooking {
  id: string;
  establishmentId: string;
  startsAt: Date;
  remindersConsent: boolean;
}

interface ResolvedSettings {
  whatsappEnabled: boolean;
  confirmationEnabled: boolean;
  cancellationEnabled: boolean;
  firstReminderMinutesBefore: number | null;
  secondReminderMinutesBefore: number | null;
}

const TERMINAL_STATUSES = ['CANCELLED', 'REJECTED', 'COMPLETED', 'NO_SHOW'];

/**
 * Creates and cancels WhatsApp notification jobs as part of the same database
 * transaction that mutates a booking. Each job is paired with an outbox event
 * so the relay can hand it to the queue once the transaction commits
 * (transactional outbox). All sends are gated on the customer's reminder
 * consent and the establishment's notification settings.
 */
@Injectable()
export class NotificationsSchedulingService {
  async scheduleForNewBooking(
    tx: Prisma.TransactionClient,
    booking: SchedulableBooking,
  ): Promise<void> {
    const settings = await this.resolveSettings(tx, booking.establishmentId);
    if (!settings.whatsappEnabled || !booking.remindersConsent) {
      return;
    }

    if (settings.confirmationEnabled) {
      await this.createJob(
        tx,
        booking,
        'BOOKING_CONFIRMED',
        new Date(),
        `booking-confirmation-${booking.id}`,
      );
    }
    await this.scheduleReminders(tx, booking, settings);
  }

  async scheduleStatusChange(
    tx: Prisma.TransactionClient,
    params: {
      booking: SchedulableBooking;
      previousStatus: string;
      newStatus: string;
    },
  ): Promise<void> {
    const { booking, newStatus } = params;
    const settings = await this.resolveSettings(tx, booking.establishmentId);

    if (newStatus === 'CONFIRMED') {
      if (!settings.whatsappEnabled || !booking.remindersConsent) {
        return;
      }
      if (settings.confirmationEnabled) {
        await this.createJob(
          tx,
          booking,
          'BOOKING_CONFIRMED',
          new Date(),
          `booking-confirmation-${booking.id}`,
        );
      }
      await this.scheduleReminders(tx, booking, settings);
      return;
    }

    if (TERMINAL_STATUSES.includes(newStatus)) {
      // A booking that is no longer active must not keep pending reminders.
      await this.cancelPendingJobs(tx, booking.id);

      if (
        newStatus === 'CANCELLED' &&
        settings.whatsappEnabled &&
        settings.cancellationEnabled &&
        booking.remindersConsent
      ) {
        await this.createJob(
          tx,
          booking,
          'BOOKING_CANCELLED',
          new Date(),
          `booking-cancellation-${booking.id}`,
        );
      }
    }
  }

  private async scheduleReminders(
    tx: Prisma.TransactionClient,
    booking: SchedulableBooking,
    settings: ResolvedSettings,
  ): Promise<void> {
    const now = Date.now();
    const reminders = [
      { index: 1, minutesBefore: settings.firstReminderMinutesBefore },
      { index: 2, minutesBefore: settings.secondReminderMinutesBefore },
    ];

    for (const reminder of reminders) {
      if (reminder.minutesBefore == null) {
        continue;
      }
      const scheduledAt = new Date(
        booking.startsAt.getTime() - reminder.minutesBefore * 60_000,
      );
      // Skip reminders whose send time has already passed.
      if (scheduledAt.getTime() <= now) {
        continue;
      }
      await this.createJob(
        tx,
        booking,
        'BOOKING_REMINDER_DUE',
        scheduledAt,
        `booking-reminder-${reminder.index}-${booking.id}`,
      );
    }
  }

  private async cancelPendingJobs(
    tx: Prisma.TransactionClient,
    bookingId: string,
  ): Promise<void> {
    await tx.notificationJob.updateMany({
      where: { bookingId, status: { in: ['PENDING', 'PROCESSING'] } },
      data: { status: 'CANCELLED' },
    });
  }

  private async createJob(
    tx: Prisma.TransactionClient,
    booking: SchedulableBooking,
    eventType: NotificationEventType,
    scheduledAt: Date,
    idempotencyKey: string,
  ): Promise<void> {
    // The unique idempotency key makes scheduling safe to call more than once
    // (e.g. a public booking created as CONFIRMED, then confirmed again).
    const existing = await tx.notificationJob.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    });
    if (existing) {
      return;
    }

    const job = await tx.notificationJob.create({
      data: {
        establishmentId: booking.establishmentId,
        bookingId: booking.id,
        channel: 'WHATSAPP',
        eventType,
        scheduledAt,
        status: 'PENDING',
        attempts: 0,
        availableAt: scheduledAt,
        idempotencyKey,
      },
      select: { id: true },
    });

    await tx.outboxEvent.create({
      data: {
        establishmentId: booking.establishmentId,
        notificationJobId: job.id,
        eventType,
      },
    });
  }

  private async resolveSettings(
    tx: Prisma.TransactionClient,
    establishmentId: string,
  ): Promise<ResolvedSettings> {
    const row = await tx.notificationSetting.findUnique({
      where: { establishmentId },
    });

    return {
      whatsappEnabled: row?.whatsappEnabled ?? true,
      confirmationEnabled: row?.confirmationEnabled ?? true,
      cancellationEnabled: row?.cancellationEnabled ?? true,
      firstReminderMinutesBefore: row ? row.firstReminderMinutesBefore : 1440,
      secondReminderMinutesBefore: row ? row.secondReminderMinutesBefore : 120,
    };
  }
}
