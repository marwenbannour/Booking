import { jest } from '@jest/globals';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  it('denies a non-member', async () => {
    const prisma = {
      establishmentMember: { findFirst: jest.fn<any>().mockResolvedValue(null) },
    };
    const service = new DashboardService(prisma as any, {} as any);

    await expect(
      service.getSummary('user-1', 'establishment-1', {}),
    ).rejects.toThrow('not an active member');
  });

  it('denies a member whose explicit permission disables reports', async () => {
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn<any>().mockResolvedValue({
          role: 'MANAGER',
          permissions: { 'reports.read': false },
        }),
      },
    };
    const service = new DashboardService(prisma as any, {} as any);

    await expect(
      service.getSummary('user-1', 'establishment-1', {}),
    ).rejects.toThrow('reports read');
  });

  it('denies an employee without an explicit grant', async () => {
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn<any>().mockResolvedValue({
          role: 'EMPLOYEE',
          permissions: {},
        }),
      },
    };
    const service = new DashboardService(prisma as any, {} as any);

    await expect(
      service.getSummary('user-1', 'establishment-1', {}),
    ).rejects.toThrow('reports read');
  });
});
