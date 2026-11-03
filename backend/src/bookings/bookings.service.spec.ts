import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import { BookingsService } from './bookings.service.js';

// No-op notification scheduler: the scheduling behaviour has its own tests.
const scheduler = {
  scheduleForNewBooking: jest.fn(),
  scheduleStatusChange: jest.fn(),
  scheduleForRescheduledBooking: jest.fn(),
};

// No-op subscription gate: quota enforcement has its own tests.
const subscriptions = {
  assertWithinBookingQuota: jest.fn(),
  assertEstablishmentActiveForBookings: jest.fn(),
};

describe('BookingsService', () => {
  it('excludes overlaps from other services using establishment-local day boundaries', async () => {
    const prisma = {
      service: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'service-1',
          durationMinutes: 30,
          establishmentId: 'establishment-1',
          establishment: {
            timezone: 'Africa/Tunis',
            minimumBookingNoticeMinutes: 60,
            maximumBookingDays: 60,
          },
        }),
      },
      employee: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'employee-1',
            displayName: 'Amira',
            services: [{ serviceId: 'service-1' }],
          },
        ]),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            employeeId: 'employee-1',
            startsAt: new Date(Date.UTC(2026, 10, 8, 8)),
            endsAt: new Date(Date.UTC(2026, 10, 8, 8, 30)),
          },
        ]),
      },
      businessHour: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      timeOff: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );
    const result = await service.getAvailability('service-1', '2026-11-08');

    expect(result.slots[0].start).toBe('2026-11-08T08:30:00.000Z');
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          establishmentId: 'establishment-1',
          status: { in: ['PENDING', 'CONFIRMED'] },
          startsAt: { lt: expect.any(Date) },
          endsAt: { gt: expect.any(Date) },
        }),
      }),
    );
    expect(prisma.service.findFirst).toHaveBeenCalled();
  });

  it('returns default availability slots when employees are active and no business-hour overrides exist', async () => {
    const prisma = {
      service: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'service-1',
          durationMinutes: 30,
          establishmentId: 'establishment-1',
          establishment: {
            timezone: 'Africa/Tunis',
            minimumBookingNoticeMinutes: 60,
            maximumBookingDays: 30,
          },
        }),
      },
      employee: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'employee-1',
            displayName: 'Amira',
            services: [{ serviceId: 'service-1' }],
          },
        ]),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      businessHour: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      timeOff: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const date = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, '0')}-${String(
      tomorrow.getUTCDate(),
    ).padStart(2, '0')}`;

    const result = await service.getAvailability('service-1', date);

    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots[0]).toEqual(
      expect.objectContaining({
        employeeId: 'employee-1',
      }),
    );
  });

  it('keeps a configured closed weekday unavailable instead of using default hours', async () => {
    const prisma = {
      service: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'service-1',
          durationMinutes: 30,
          establishmentId: 'establishment-1',
          establishment: {
            timezone: 'Africa/Tunis',
            minimumBookingNoticeMinutes: 0,
            maximumBookingDays: 60,
          },
        }),
      },
      employee: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'employee-1',
            displayName: 'Amira',
            services: [{ serviceId: 'service-1' }],
          },
        ]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
      businessHour: {
        findMany: jest.fn().mockResolvedValue([
          {
            employeeId: null,
            dayOfWeek: 1,
            opensAt: new Date(Date.UTC(1970, 0, 1, 9)),
            closesAt: new Date(Date.UTC(1970, 0, 1, 17)),
          },
        ]),
      },
      timeOff: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );
    const result = await service.getAvailability('service-1', '2026-11-08');

    expect(result.slots).toEqual([]);
    expect(prisma.businessHour.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ dayOfWeek: 0 }),
      }),
    );
  });

  it('replays a completed idempotent booking before checking current availability', async () => {
    const startsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const payload = {
      establishmentSlug: 'salon-test',
      serviceId: 'service-1',
      startsAt,
      customerName: 'Alice',
      customerPhone: '+21620000000',
      consentToReminders: false,
      idempotencyKey: 'request-1',
    };
    const requestHash = createHash('sha256')
      .update(
        JSON.stringify({
          establishmentId: 'establishment-1',
          serviceId: payload.serviceId,
          employeeId: null,
          startsAt: startsAt.toISOString(),
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerEmail: null,
          consentToReminders: false,
        }),
      )
      .digest('hex');
    const storedBooking = {
      id: 'booking-1',
      publicReference: 'BK-ABC123',
      startsAt,
      endsAt: new Date(startsAt.getTime() + 30 * 60_000),
      service: { name: 'Massage', durationMinutes: 30 },
      employee: { displayName: 'Amira' },
    };
    const tx = {
      establishment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'establishment-1',
          name: 'Salon Test',
          timezone: 'Africa/Tunis',
          minimumBookingNoticeMinutes: 60,
          maximumBookingDays: 60,
        }),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
      // 1st $queryRaw = INSERT ... RETURNING (no row => key already existed),
      // 2nd = SELECT ... FOR UPDATE (returns the stored record to replay).
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValue([
          {
            request_hash: requestHash,
            resource_id: 'booking-1',
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
          },
        ]),
      booking: {
        findUnique: jest.fn().mockResolvedValue(storedBooking),
      },
      bookingAccessToken: {
        create: jest.fn().mockResolvedValue({ id: 'access-token-1' }),
      },
    };
    const prisma = {
      establishment: {
        findFirst: jest.fn().mockResolvedValue({ id: 'establishment-1' }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
      {
        get: jest
          .fn()
          .mockReturnValue('a-secure-test-secret-that-is-long-enough'),
      } as any,
    );
    const availability = jest.spyOn(service, 'getAvailability');

    const result = await service.createPublicBooking(payload);

    expect(result).toEqual({
      booking: storedBooking,
      establishment: { name: 'Salon Test' },
      customerAccessToken: expect.any(String),
      idempotent: true,
    });
    expect(availability).not.toHaveBeenCalled();
    expect(tx.booking.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'booking-1' } }),
    );
  });

  it('confirms public bookings and rejects an occupied slot', async () => {
    const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const createdBooking = {
      id: 'booking-1',
      publicReference: 'BK-ABC123',
      startsAt,
      endsAt: new Date(startsAt.getTime() + 30 * 60_000),
      service: { name: 'Massage', durationMinutes: 30 },
      employee: { displayName: 'Amira' },
    };
    const tx = {
      establishment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'establishment-1',
          name: 'Salon Test',
          timezone: 'Africa/Tunis',
          currency: 'TND',
          minimumBookingNoticeMinutes: 60,
          maximumBookingDays: 60,
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'employee-1' }]),
      service: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'service-1',
          name: 'Massage',
          durationMinutes: 30,
          price: 50,
        }),
      },
      employee: {
        findFirst: jest.fn().mockResolvedValue({ id: 'employee-1' }),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createdBooking),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'customer-1',
          preferredLocale: 'fr',
        }),
      },
      bookingAccessToken: {
        create: jest.fn().mockResolvedValue({ id: 'access-token-1' }),
      },
    };
    const prisma = {
      establishment: {
        findFirst: jest.fn().mockResolvedValue({ id: 'establishment-1' }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
      {
        get: jest
          .fn()
          .mockReturnValue('a-secure-test-secret-that-is-long-enough'),
      } as any,
    );
    jest.spyOn(service, 'getAvailability').mockResolvedValue({
      slots: [{ start: startsAt.toISOString(), employeeId: 'employee-1' }],
    } as any);
    scheduler.scheduleForNewBooking.mockClear();

    const payload = {
      establishmentSlug: 'salon-test',
      serviceId: 'service-1',
      startsAt,
      customerName: 'Alice',
      customerPhone: '+21620000000',
      consentToReminders: true,
      locale: 'fr',
    } as const;
    const result = await service.createPublicBooking(payload);

    expect(result.booking).toEqual(createdBooking);
    expect(result.customerAccessToken).toEqual(expect.any(String));
    expect(tx.bookingAccessToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          establishmentId: 'establishment-1',
          bookingId: 'booking-1',
          tokenHash: expect.any(Buffer),
          scopes: expect.arrayContaining(['booking:reschedule']),
        }),
      }),
    );
    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'CONFIRMED',
          source: 'WEB',
          remindersConsent: true,
        }),
      }),
    );
    expect(scheduler.scheduleForNewBooking).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        id: 'booking-1',
        establishmentId: 'establishment-1',
        remindersConsent: true,
      }),
    );

    tx.booking.findFirst.mockResolvedValue({ id: 'existing-booking' });
    scheduler.scheduleForNewBooking.mockClear();
    await expect(service.createPublicBooking(payload)).rejects.toThrow(
      'The selected slot is no longer available',
    );
    expect(tx.booking.create).toHaveBeenCalledTimes(1);
    expect(scheduler.scheduleForNewBooking).not.toHaveBeenCalled();
  });

  it('rejects reusing a public booking idempotency key with a different payload', async () => {
    const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const tx = {
      establishment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'establishment-1',
          name: 'Salon Test',
        }),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            request_hash: 'hash-for-another-payload',
            resource_id: null,
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
          },
        ]),
      service: { findFirst: jest.fn() },
    };
    const prisma = {
      establishment: {
        findFirst: jest.fn().mockResolvedValue({ id: 'establishment-1' }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );
    scheduler.scheduleForNewBooking.mockClear();

    await expect(
      service.createPublicBooking({
        establishmentSlug: 'salon-test',
        serviceId: 'service-1',
        startsAt,
        customerName: 'Alice',
        customerPhone: '+21620000000',
        consentToReminders: false,
        idempotencyKey: 'request-1',
      }),
    ).rejects.toThrow(
      'The idempotency key was reused with a different payload',
    );
    expect(tx.service.findFirst).not.toHaveBeenCalled();
    expect(scheduler.scheduleForNewBooking).not.toHaveBeenCalled();
  });

  it('creates a reschedule request only with a valid scoped booking access token', async () => {
    const requestedStartsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const accessToken = 'A'.repeat(43);
    const tx = {
      bookingAccessToken: {
        findFirst: jest.fn().mockResolvedValue({
          establishmentId: 'establishment-1',
        }),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'booking-1',
          status: 'CONFIRMED',
          startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          employeeId: 'employee-1',
          serviceId: 'service-1',
          durationMinutesSnapshot: 30,
        }),
      },
      bookingRescheduleRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'request-1',
          status: 'PENDING',
          originalStartsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          requestedStartsAt,
          createdAt: new Date(),
        }),
      },
      establishment: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          timezone: 'Africa/Tunis',
        }),
      },
      bookingEvent: { create: jest.fn().mockResolvedValue({ id: 'event-1' }) },
    };
    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );
    jest.spyOn(service, 'getAvailability').mockResolvedValue({
      slots: [
        {
          start: requestedStartsAt.toISOString(),
          employeeId: 'employee-1',
        },
      ],
    } as any);

    const request = await service.createPublicRescheduleRequest(
      'booking-1',
      accessToken,
      requestedStartsAt,
      'employee-1',
    );

    expect(request.id).toBe('request-1');
    expect(tx.bookingAccessToken.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bookingId: 'booking-1',
          tokenHash: createHash('sha256').update(accessToken).digest(),
          scopes: { has: 'booking:reschedule' },
        }),
      }),
    );
    expect(tx.bookingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'RESCHEDULE_REQUESTED',
        }),
      }),
    );

    tx.bookingAccessToken.findFirst.mockResolvedValue(null);
    await expect(
      service.createPublicRescheduleRequest(
        'booking-1',
        'B'.repeat(43),
        requestedStartsAt,
        'employee-1',
      ),
    ).rejects.toThrow('Booking access token is invalid or expired');
    expect(tx.booking.findFirst).toHaveBeenCalledTimes(1);
  });

  it('accepts a reschedule only after revalidating and audits the old and new times', async () => {
    const originalStartsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const requestedStartsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const tx = {
      bookingRescheduleRequest: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'request-1',
          bookingId: 'booking-1',
          establishmentId: 'establishment-1',
          originalStartsAt,
          originalEmployeeId: 'employee-1',
          requestedStartsAt,
          requestedEmployeeId: 'employee-2',
          booking: {
            id: 'booking-1',
            status: 'CONFIRMED',
            startsAt: originalStartsAt,
            endsAt: new Date(originalStartsAt.getTime() + 30 * 60_000),
            employeeId: 'employee-1',
            serviceId: 'service-1',
            durationMinutesSnapshot: 30,
            version: 1,
            remindersConsent: true,
          },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'request-1',
          status: 'ACCEPTED',
        }),
      },
      establishment: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          timezone: 'Africa/Tunis',
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'employee-2' }]),
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ version: 2 }),
      },
      bookingEvent: { create: jest.fn().mockResolvedValue({ id: 'event-1' }) },
      auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'MANAGER',
          permissions: {},
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );
    jest.spyOn(service, 'getAvailability').mockResolvedValue({
      slots: [
        {
          start: requestedStartsAt.toISOString(),
          employeeId: 'employee-2',
        },
      ],
    } as any);
    scheduler.scheduleForRescheduledBooking.mockClear();

    await expect(
      service.decideRescheduleRequest(
        'user-1',
        'establishment-1',
        'booking-1',
        'request-1',
        'REJECTED',
      ),
    ).rejects.toThrow('A reason is required to reject a request');
    expect(tx.bookingRescheduleRequest.update).not.toHaveBeenCalled();

    const result = await service.decideRescheduleRequest(
      'user-1',
      'establishment-1',
      'booking-1',
      'request-1',
      'ACCEPTED',
    );

    expect(result.status).toBe('ACCEPTED');
    expect(tx.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'booking-1',
          version: 1,
          status: 'CONFIRMED',
        },
        data: expect.objectContaining({
          startsAt: requestedStartsAt,
          employeeId: 'employee-2',
          version: { increment: 1 },
        }),
      }),
    );
    expect(tx.bookingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'RESCHEDULED',
          data: expect.objectContaining({
            previousStartsAt: originalStartsAt.toISOString(),
            startsAt: requestedStartsAt.toISOString(),
          }),
        }),
      }),
    );
    expect(scheduler.scheduleForRescheduledBooking).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        id: 'booking-1',
        startsAt: requestedStartsAt,
        version: 2,
      }),
    );

    jest.spyOn(service, 'getAvailability').mockResolvedValue({
      slots: [],
    } as any);
    await expect(
      service.decideRescheduleRequest(
        'user-1',
        'establishment-1',
        'booking-1',
        'request-1',
        'ACCEPTED',
      ),
    ).rejects.toThrow('The selected slot is no longer available');
    expect(tx.booking.update).toHaveBeenCalledTimes(1);
    expect(tx.bookingRescheduleRequest.update).toHaveBeenCalledTimes(1);
  });

  it('lists bookings filtered by status and employee', async () => {
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'MANAGER',
          permissions: {},
        }),
      },
      $transaction: jest.fn().mockResolvedValue([
        [
          {
            id: 'booking-9',
            status: 'CONFIRMED',
            publicReference: 'BK-123',
            employee: { id: 'employee-1', displayName: 'Amira' },
            service: { id: 'service-1', name: 'Massage' },
            customer: {
              id: 'customer-1',
              name: 'Alice',
              phoneNormalized: '+21620000000',
            },
          },
        ],
        1,
      ]),
      booking: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'booking-9',
            status: 'CONFIRMED',
            publicReference: 'BK-123',
            employee: { id: 'employee-1', displayName: 'Amira' },
            service: { id: 'service-1', name: 'Massage' },
            customer: {
              id: 'customer-1',
              name: 'Alice',
              phoneNormalized: '+21620000000',
            },
          },
        ]),
      },
    };

    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );
    const result = await service.listBookings('user-1', 'establishment-1', {
      status: 'CONFIRMED',
      employeeId: 'employee-1',
      limit: 10,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.items[0].status).toBe('CONFIRMED');
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          establishmentId: 'establishment-1',
          status: 'CONFIRMED',
          employeeId: 'employee-1',
        }),
      }),
    );
  });

  it('scopes an employee booking list to their linked employee profile', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'EMPLOYEE',
          permissions: {},
          employee: { id: 'employee-own' },
        }),
      },
      $transaction: jest.fn().mockResolvedValue([[], 0]),
      booking: { findMany, count: jest.fn().mockResolvedValue(0) },
    };

    await new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    ).listBookings('user-employee', 'establishment-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          establishmentId: 'establishment-1',
          employeeId: 'employee-own',
        },
      }),
    );
  });

  it('denies a member whose explicit permission disables booking reads', async () => {
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'MANAGER',
          permissions: { 'bookings.read': false },
        }),
      },
      booking: { findMany: jest.fn(), count: jest.fn() },
    };

    await expect(
      new BookingsService(
        prisma as any,
        scheduler as any,
        subscriptions as any,
      ).listBookings('user-manager', 'establishment-1'),
    ).rejects.toThrow('You do not have permission to bookings read');
    expect(prisma.booking.findMany).not.toHaveBeenCalled();
  });

  it('does not disclose bookings when a status change uses another tenant scope', async () => {
    const membershipLookup = jest.fn();
    const prisma = {
      establishmentMember: { findFirst: membershipLookup },
      booking: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    await expect(
      new BookingsService(
        prisma as any,
        scheduler as any,
        subscriptions as any,
      ).transitionBookingStatus('booking-from-another-tenant', 'CANCELLED', {
        establishmentId: 'establishment-1',
        actorUserId: 'user-1',
        reason: 'Requested cancellation',
      }),
    ).rejects.toThrow('Booking not found');
    expect(membershipLookup).not.toHaveBeenCalled();
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'booking-from-another-tenant',
          establishmentId: 'establishment-1',
        },
      }),
    );
  });

  it('returns booking details with its events only to an active establishment member', async () => {
    const eventRows = [
      {
        id: 'event-1',
        eventType: 'CONFIRMED',
        actorUserId: 'user-1',
        data: { previousStatus: 'PENDING', newStatus: 'CONFIRMED' },
        createdAt: new Date('2026-10-28T10:00:00.000Z'),
      },
    ];
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'MANAGER',
          permissions: {},
        }),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'booking-9',
          status: 'CONFIRMED',
          publicReference: 'BK-123',
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue(eventRows),
    };

    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );
    const details = await service.getBookingDetails(
      'user-1',
      'establishment-1',
      'booking-9',
    );

    expect(details.events).toEqual(eventRows);
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-9', establishmentId: 'establishment-1' },
      }),
    );
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('allows a confirmed booking to transition to completed and records an audit event', async () => {
    const txAuditLogCreate = jest.fn().mockResolvedValue({ id: 'audit-1' });
    const txExecuteRaw = jest.fn().mockResolvedValue(undefined);
    const txBookingUpdate = jest.fn().mockResolvedValue({
      id: 'booking-1',
      status: 'COMPLETED',
      version: 2,
      publicReference: 'BK-ABC123',
      customerNameSnapshot: 'Alice',
      customerPhoneSnapshot: '+21620000000',
      serviceNameSnapshot: 'Massage',
      startsAt: new Date('2026-10-28T10:00:00.000Z'),
      endsAt: new Date('2026-10-28T10:30:00.000Z'),
      cancellationReason: null,
    });
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'MANAGER',
          permissions: {},
        }),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'booking-1',
          status: 'CONFIRMED',
          version: 1,
          establishmentId: 'establishment-1',
          startsAt: new Date(Date.now() - 60 * 60 * 1000),
          cancellationReason: null,
          establishment: { cancellationNoticeHours: 24 },
        }),
      },
      $transaction: jest.fn(async (callback) =>
        callback({
          booking: {
            findFirst: jest.fn().mockResolvedValue({
              id: 'booking-1',
              status: 'CONFIRMED',
              version: 1,
              establishmentId: 'establishment-1',
              startsAt: new Date(Date.now() - 60 * 60 * 1000),
              cancellationReason: null,
              establishment: { cancellationNoticeHours: 24 },
            }),
            update: txBookingUpdate,
          },
          $executeRaw: txExecuteRaw,
          auditLog: {
            create: txAuditLogCreate,
          },
          bookingRescheduleRequest: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          bookingAccessToken: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        }),
      ),
    };

    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );
    const result = await service.transitionBookingStatus(
      'booking-1',
      'COMPLETED',
      {
        establishmentId: 'establishment-1',
        actorUserId: 'user-1',
        correlationId: 'corr-1',
      },
    );

    expect(result.status).toBe('COMPLETED');
    expect(txBookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-1' },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      }),
    );
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-1', establishmentId: 'establishment-1' },
      }),
    );
    expect(txExecuteRaw).toHaveBeenCalledTimes(1);
    expect(txAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'booking.completed',
          targetId: 'booking-1',
        }),
      }),
    );
  });

  it('requires a reason and blocks late cancellations within the notice window', async () => {
    const pendingBooking = {
      id: 'booking-2',
      status: 'PENDING',
      version: 1,
      establishmentId: 'establishment-1',
      startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      cancellationReason: null,
      establishment: { cancellationNoticeHours: 24 },
    };
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'MANAGER',
          permissions: {},
        }),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue(pendingBooking),
      },
    };

    const service = new BookingsService(
      prisma as any,
      scheduler as any,
      subscriptions as any,
    );

    await expect(
      service.transitionBookingStatus('booking-2', 'REJECTED', {
        establishmentId: 'establishment-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Rejections require a reason');
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-2', establishmentId: 'establishment-1' },
      }),
    );

    prisma.booking.findFirst.mockResolvedValue({
      ...pendingBooking,
      status: 'CONFIRMED',
    });

    await expect(
      service.transitionBookingStatus('booking-2', 'CANCELLED', {
        establishmentId: 'establishment-1',
        reason: 'Customer requested cancellation',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow(
      'Bookings may only be cancelled before the 24-hour notice window',
    );
  });
});
