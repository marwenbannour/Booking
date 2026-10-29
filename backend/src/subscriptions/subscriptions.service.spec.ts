import { jest } from '@jest/globals';
import { SubscriptionsService } from './subscriptions.service.js';

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    subscription: {
      findUnique: jest.fn<any>().mockResolvedValue(null),
    },
    subscriptionPlan: {
      findUnique: jest.fn<any>().mockResolvedValue(null),
    },
    employee: { count: jest.fn<any>().mockResolvedValue(0) },
    booking: { count: jest.fn<any>().mockResolvedValue(0) },
    notificationLog: { count: jest.fn<any>().mockResolvedValue(0) },
    ...overrides,
  };
}

describe('SubscriptionsService quotas', () => {
  it('falls back to the free plan and blocks a new employee over the limit', async () => {
    const prisma = makePrisma({
      subscriptionPlan: {
        findUnique: jest.fn<any>().mockResolvedValue({ maxEmployees: 2 }),
      },
      employee: { count: jest.fn<any>().mockResolvedValue(2) },
    });
    const service = new SubscriptionsService(prisma as any);

    await expect(
      service.assertWithinEmployeeQuota('establishment-1'),
    ).rejects.toMatchObject({
      response: { code: 'QUOTA_EXCEEDED' },
    });
    expect(prisma.subscriptionPlan.findUnique).toHaveBeenCalledWith({
      where: { code: 'free' },
    });
  });

  it('allows an employee when the plan grants unlimited seats', async () => {
    const prisma = makePrisma({
      subscription: {
        findUnique: jest.fn<any>().mockResolvedValue({
          status: 'ACTIVE',
          plan: { maxEmployees: null },
          currentPeriodStart: new Date('2026-10-01T00:00:00Z'),
          currentPeriodEnd: new Date('2026-11-01T00:00:00Z'),
        }),
      },
    });
    const service = new SubscriptionsService(prisma as any);

    await expect(
      service.assertWithinEmployeeQuota('establishment-1'),
    ).resolves.toBeUndefined();
    expect(prisma.employee.count).not.toHaveBeenCalled();
  });

  it('blocks new bookings when the subscription is suspended', async () => {
    const prisma = makePrisma({
      subscription: {
        findUnique: jest.fn<any>().mockResolvedValue({
          status: 'SUSPENDED',
          plan: { maxBookingsPerMonth: 1000 },
          currentPeriodStart: new Date('2026-10-01T00:00:00Z'),
          currentPeriodEnd: new Date('2026-11-01T00:00:00Z'),
        }),
      },
    });
    const service = new SubscriptionsService(prisma as any);

    await expect(
      service.assertWithinBookingQuota('establishment-1'),
    ).rejects.toMatchObject({
      response: { code: 'SUBSCRIPTION_INACTIVE' },
    });
    expect(prisma.booking.count).not.toHaveBeenCalled();
  });

  it('reports the notification quota as reached only at the limit', async () => {
    const plan = { maxNotificationsPerMonth: 100 };
    const base = {
      status: 'ACTIVE',
      plan,
      currentPeriodStart: new Date('2026-10-01T00:00:00Z'),
      currentPeriodEnd: new Date('2026-11-01T00:00:00Z'),
    };

    const under = new SubscriptionsService(
      makePrisma({
        subscription: { findUnique: jest.fn<any>().mockResolvedValue(base) },
        notificationLog: { count: jest.fn<any>().mockResolvedValue(99) },
      }) as any,
    );
    const atLimit = new SubscriptionsService(
      makePrisma({
        subscription: { findUnique: jest.fn<any>().mockResolvedValue(base) },
        notificationLog: { count: jest.fn<any>().mockResolvedValue(100) },
      }) as any,
    );

    expect(await under.isNotificationQuotaExceeded('establishment-1')).toBe(false);
    expect(await atLimit.isNotificationQuotaExceeded('establishment-1')).toBe(true);
  });
});
