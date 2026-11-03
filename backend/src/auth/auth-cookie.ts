import type { Request, Response } from 'express';

export const REFRESH_COOKIE_NAME = 'booking_refresh';
export const REFRESH_COOKIE_PATH = '/api/v1/auth/refresh';

export function extractRefreshCookie(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0) continue;
    if (cookie.slice(0, separator).trim() !== REFRESH_COOKIE_NAME) continue;
    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function setRefreshCookie(
  response: Response,
  token: string,
  maxAgeSeconds: number,
  secure: boolean,
  sameSite: 'lax' | 'strict' | 'none',
): void {
  response.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite,
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeSeconds * 1000,
  });
}

export function clearRefreshCookie(
  response: Response,
  secure: boolean,
  sameSite: 'lax' | 'strict' | 'none',
): void {
  response.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite,
    path: REFRESH_COOKIE_PATH,
  });
}
