import { jest } from '@jest/globals';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns a ready status after verifying PostgreSQL connectivity', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const result = await new HealthController(prisma as any).getHealth();

    expect(result.status).toBe('ok');
    expect(result.dependencies.postgres).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('returns a readiness error when PostgreSQL is unavailable', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')) };

    await expect(new HealthController(prisma as any).getHealth()).rejects.toMatchObject({
      status: 503,
    });
  });

  it('returns a liveness status without checking dependencies', () => {
    const result = new HealthController({} as any).getLiveness();

    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
