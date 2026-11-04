import { areWorkersEnabled } from './worker-runtime.js';

describe('areWorkersEnabled', () => {
  it('enables workers by default in persistent runtimes', () => {
    expect(areWorkersEnabled({})).toBe(true);
  });

  it('honors an explicit worker disable flag', () => {
    expect(areWorkersEnabled({ WORKERS_ENABLED: 'false' })).toBe(false);
  });

  it('disables workers on Vercel even when explicitly enabled', () => {
    expect(areWorkersEnabled({ VERCEL: '1', WORKERS_ENABLED: 'true' })).toBe(false);
  });
});
