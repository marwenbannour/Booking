import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';

export interface ThrottleOptions {
  /** Maximum number of requests allowed within the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /** Optional stable bucket name; defaults to the controller+handler name. */
  name?: string;
}

/**
 * Rate-limits a route per client IP. Applied to authentication and public
 * endpoints. See {@link ThrottlerGuard}.
 */
export const Throttle = (options: ThrottleOptions) =>
  SetMetadata(THROTTLE_KEY, options);
