import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns a readiness status and timestamp', () => {
    const result = new HealthController().getHealth();

    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
