import {
  eachLocalDate,
  localDateString,
  localDayWindow,
  localMidnightUtc,
} from './dashboard-time.util.js';

// Africa/Tunis is a fixed UTC+1 offset (no DST), which keeps these assertions
// deterministic across machines.
describe('dashboard-time.util', () => {
  it('maps an instant to its local calendar date', () => {
    expect(
      localDateString(new Date('2026-11-09T23:30:00Z'), 'Africa/Tunis'),
    ).toBe('2026-11-10');
  });

  it('resolves local midnight to the correct UTC instant', () => {
    expect(
      localMidnightUtc('Africa/Tunis', 2026, 11, 10).toISOString(),
    ).toBe('2026-11-09T23:00:00.000Z');
  });

  it('produces a start/end day window spanning 24h', () => {
    const { start, end } = localDayWindow('Africa/Tunis', new Date('2026-11-10T09:00:00Z'));
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(start.toISOString()).toBe('2026-11-09T23:00:00.000Z');
  });

  it('enumerates the distinct local dates covered by a window', () => {
    const dates = eachLocalDate(
      'Africa/Tunis',
      new Date('2026-11-09T00:00:00Z'),
      new Date('2026-11-12T00:00:00Z'),
    );
    expect(dates.length).toBeGreaterThanOrEqual(3);
    for (const entry of dates) {
      expect(entry.dow).toBeGreaterThanOrEqual(0);
      expect(entry.dow).toBeLessThanOrEqual(6);
    }
  });
});
