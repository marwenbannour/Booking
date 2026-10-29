import { jest } from '@jest/globals';
import { NotificationsSchedulingService } from './notifications-scheduling.service.js';

function createTx(settings: unknown = null) {
  return {
    notificationSetting: {
      findUnique: jest.fn<any>().mockResolvedValue(settings),
    },
    notificationJob: {
      findUnique: jest.fn<any>().mockResolvedValue(null),
      create: jest.fn<any>().mockResolvedValue({ id: 'job-1' }),
      updateMany: jest.fn<any>().mockResolvedValue({ count: 2 }),
    },
    outboxEvent: {
      create: jest.fn<any>().mockResolvedValue({ id: 'outbox-1' }),
    },
  };
}

describe('NotificationsSchedulingService', () => {
  const service = new NotificationsSchedulingService();

  it('schedules a confirmation and both reminders for a consenting booking', async () => {
    const tx = createTx();
    const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await service.scheduleForNewBooking(tx as any, {
      id: 'booking-1',
      establishmentId: 'establishment-1',
      startsAt,
      remindersConsent: true,
    });

    // confirmation + 24h reminder + 2h reminder
    expect(tx.notificationJob.create).toHaveBeenCalledTimes(3);
    expect(tx.outboxEvent.create).toHaveBeenCalledTimes(3);
    const eventTypes = tx.notificationJob.create.mock.calls.map(
      (call: any) => call[0].data.eventType,
    );
    expect(eventTypes).toEqual([
      'BOOKING_CONFIRMED',
      'BOOKING_REMINDER_DUE',
      'BOOKING_REMINDER_DUE',
    ]);
  });

  it('schedules nothing when the customer has not consented', async () => {
    const tx = createTx();

    await service.scheduleForNewBooking(tx as any, {
      id: 'booking-1',
      establishmentId: 'establishment-1',
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      remindersConsent: false,
    });

    expect(tx.notificationJob.create).not.toHaveBeenCalled();
    expect(tx.outboxEvent.create).not.toHaveBeenCalled();
  });

  it('skips reminders whose lead time has already passed', async () => {
    const tx = createTx();
    // Starts in 30 minutes: both the 24h and 2h reminders are in the past.
    const startsAt = new Date(Date.now() + 30 * 60 * 1000);

    await service.scheduleForNewBooking(tx as any, {
      id: 'booking-1',
      establishmentId: 'establishment-1',
      startsAt,
      remindersConsent: true,
    });

    expect(tx.notificationJob.create).toHaveBeenCalledTimes(1);
    expect(tx.notificationJob.create.mock.calls[0][0].data.eventType).toBe(
      'BOOKING_CONFIRMED',
    );
  });

  it('cancels pending jobs and queues a cancellation notice on CANCELLED', async () => {
    const tx = createTx();

    await service.scheduleStatusChange(tx as any, {
      booking: {
        id: 'booking-1',
        establishmentId: 'establishment-1',
        startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        remindersConsent: true,
      },
      previousStatus: 'CONFIRMED',
      newStatus: 'CANCELLED',
    });

    expect(tx.notificationJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bookingId: 'booking-1',
          status: { in: ['PENDING', 'PROCESSING'] },
        }),
        data: { status: 'CANCELLED' },
      }),
    );
    expect(tx.notificationJob.create.mock.calls[0][0].data.eventType).toBe(
      'BOOKING_CANCELLED',
    );
  });

  it('only cancels pending jobs on COMPLETED without sending anything', async () => {
    const tx = createTx();

    await service.scheduleStatusChange(tx as any, {
      booking: {
        id: 'booking-1',
        establishmentId: 'establishment-1',
        startsAt: new Date(Date.now() - 60 * 60 * 1000),
        remindersConsent: true,
      },
      previousStatus: 'CONFIRMED',
      newStatus: 'COMPLETED',
    });

    expect(tx.notificationJob.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.notificationJob.create).not.toHaveBeenCalled();
  });

  it('does not duplicate a confirmation that already exists', async () => {
    const tx = createTx();
    tx.notificationJob.findUnique.mockResolvedValue({ id: 'existing' });

    await service.scheduleStatusChange(tx as any, {
      booking: {
        id: 'booking-1',
        establishmentId: 'establishment-1',
        startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        remindersConsent: true,
      },
      previousStatus: 'PENDING',
      newStatus: 'CONFIRMED',
    });

    expect(tx.notificationJob.create).not.toHaveBeenCalled();
  });
});
