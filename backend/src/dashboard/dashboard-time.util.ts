/**
 * Timezone helpers for reporting. Day boundaries and day-bucketing use the
 * establishment's local calendar, resolved through the runtime Intl database so
 * DST transitions are handled.
 */

function tzOffsetMinutes(date: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;

  if (!name || name === 'GMT') {
    return 0;
  }
  const match = name.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) {
    return 0;
  }
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0));
}

/** Local calendar date (YYYY-MM-DD) of an instant in a timezone. */
export function localDateString(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

/** The UTC instant of local midnight for a given local calendar date. */
export function localMidnightUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
): Date {
  const localAsUtc = Date.UTC(year, month - 1, day);
  let utcMs = localAsUtc;
  for (let i = 0; i < 3; i += 1) {
    const offset = tzOffsetMinutes(new Date(utcMs), timeZone);
    const adjusted = localAsUtc - offset * 60_000;
    if (adjusted === utcMs) {
      break;
    }
    utcMs = adjusted;
  }
  return new Date(utcMs);
}

/** Start (inclusive) and end (exclusive) of the local day containing `now`. */
export function localDayWindow(
  timeZone: string,
  now: Date,
): { start: Date; end: Date } {
  const [y, m, d] = localDateString(now, timeZone).split('-').map(Number);
  const start = localMidnightUtc(timeZone, y, m, d);
  const end = localMidnightUtc(timeZone, y, m, d + 1);
  return { start, end };
}

/**
 * Distinct local dates covered by [from, to), each with its weekday
 * (0 Sunday … 6 Saturday). Used to sum working capacity across a window.
 */
export function eachLocalDate(
  timeZone: string,
  from: Date,
  to: Date,
): Array<{ dow: number }> {
  const result: Array<{ dow: number }> = [];
  const seen = new Set<string>();
  // Step a little under a day to avoid skipping a date across a DST shift.
  for (
    let cursor = from.getTime();
    cursor < to.getTime();
    cursor += 12 * 60 * 60 * 1000
  ) {
    const key = localDateString(new Date(cursor), timeZone);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const [y, m, d] = key.split('-').map(Number);
    result.push({ dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() });
  }
  return result;
}
