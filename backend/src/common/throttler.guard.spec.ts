import { jest } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { ThrottlerGuard } from './throttler.guard.js';
import type { ThrottleOptions } from './throttle.decorator.js';

function makeContext(ip: string) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => ({ headers: {}, ip }),
      getResponse: () => ({ setHeader: jest.fn() }),
    }),
  } as any;
}

function guardWith(options: ThrottleOptions | undefined) {
  const reflector = { getAllAndOverride: () => options } as any;
  return new ThrottlerGuard(reflector);
}

describe('ThrottlerGuard', () => {
  it('allows requests up to the limit then blocks with 429', () => {
    const guard = guardWith({ limit: 2, windowSeconds: 60, name: 'test' });
    const ctx = makeContext('1.1.1.1');

    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    try {
      guard.canActivate(ctx);
      throw new Error('expected a throttling error');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }
  });

  it('tracks limits per client IP', () => {
    const guard = guardWith({ limit: 1, windowSeconds: 60, name: 'test' });
    expect(guard.canActivate(makeContext('1.1.1.1'))).toBe(true);
    expect(guard.canActivate(makeContext('2.2.2.2'))).toBe(true);
    expect(() => guard.canActivate(makeContext('1.1.1.1'))).toThrow(
      HttpException,
    );
  });

  it('does not limit routes without throttle metadata', () => {
    const guard = guardWith(undefined);
    const ctx = makeContext('1.1.1.1');
    for (let i = 0; i < 100; i += 1) {
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });
});
