import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { THROTTLE_KEY, type ThrottleOptions } from './throttle.decorator.js';

interface Counter {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window, per-IP rate limiter driven by the {@link Throttle} decorator.
 * Routes without the decorator are not limited.
 *
 * The counter store is in-memory, so limits are per process and reset on
 * restart — adequate for slowing brute-force and abuse on a single instance.
 * A multi-instance deployment should back this with a shared store (e.g.
 * Redis) for global limits.
 */
@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly counters = new Map<string, Counter>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<ThrottleOptions>(
      THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const bucket =
      options.name ??
      `${context.getClass().name}.${context.getHandler().name}`;
    const key = `${bucket}:${this.clientIp(request)}`;
    const now = Date.now();
    const windowMs = options.windowSeconds * 1000;

    let counter = this.counters.get(key);
    if (!counter || counter.resetAt <= now) {
      counter = { count: 0, resetAt: now + windowMs };
      this.counters.set(key, counter);
    }
    counter.count += 1;

    if (this.counters.size > 10_000) {
      this.sweep(now);
    }

    if (counter.count > options.limit) {
      const retryAfter = Math.max(1, Math.ceil((counter.resetAt - now) / 1000));
      const response = context.switchToHttp().getResponse<Response>();
      response.setHeader?.('Retry-After', String(retryAfter));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please retry later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private clientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length) {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length) {
      return forwarded[0];
    }
    return request.ip ?? 'unknown';
  }

  private sweep(now: number): void {
    for (const [key, counter] of this.counters) {
      if (counter.resetAt <= now) {
        this.counters.delete(key);
      }
    }
  }
}
