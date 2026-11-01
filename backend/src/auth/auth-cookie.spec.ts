import { jest } from '@jest/globals';
import type { Request } from 'express';
import type { Response } from 'express';
import {
  clearRefreshCookie,
  extractRefreshCookie,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  setRefreshCookie,
} from './auth-cookie.js';

describe('refresh token cookie helpers', () => {
  it('extracts and decodes the refresh cookie without relying on cookie-parser', () => {
    const request = {
      headers: {
        cookie: `other=value; ${REFRESH_COOKIE_NAME}=abc%2Fdef%3D`,
      },
    };

    expect(extractRefreshCookie(request as unknown as Request)).toBe('abc/def=');
  });

  it('sets an HttpOnly Secure cookie scoped to auth endpoints', () => {
    const cookie = jest.fn();
    const response = { cookie } as unknown as Response;

    setRefreshCookie(response, 'opaque-token', 3600, true, 'lax');

    expect(cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      'opaque-token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: REFRESH_COOKIE_PATH,
        maxAge: 3_600_000,
      }),
    );
  });

  it('clears the same scoped cookie on logout', () => {
    const clearCookie = jest.fn();
    const response = { clearCookie } as unknown as Response;

    clearRefreshCookie(response, true, 'lax');

    expect(clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: REFRESH_COOKIE_PATH,
      }),
    );
  });
});
