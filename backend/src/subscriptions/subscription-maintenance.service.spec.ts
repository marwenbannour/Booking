import { jest } from '@jest/globals';
import { SubscriptionMaintenanceService } from './subscription-maintenance.service.js';

describe('SubscriptionMaintenanceService.runOnce', () => {
  it('expires ended periods and moves ended trials to past due', async () => {
    const updateMany = jest
      .fn<any>()
      .mockResolvedValueOnce({ count: 2 }) // expired
      .mockResolvedValueOnce({ count: 1 }); // past due
    const prisma = { subscription: { updateMany } };
    const config = { get: () => 'false' }; // disabled timer; we call runOnce directly
    const service = new SubscriptionMaintenanceService(
      prisma as any,
      config as any,
    );

    const now = new Date('2026-11-01T00:00:00Z');
    const result = await service.runOnce(now);

    expect(result).toEqual({ expired: 2, pastDue: 1 });
    expect(updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] },
          currentPeriodEnd: { lte: now },
        }),
        data: { status: 'EXPIRED' },
      }),
    );
    expect(updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'TRIALING',
          trialEndsAt: { lte: now },
          currentPeriodEnd: { gt: now },
        }),
        data: { status: 'PAST_DUE' },
      }),
    );
  });
});
