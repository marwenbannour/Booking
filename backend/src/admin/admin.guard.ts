import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../database/prisma.service.js';
import type { AuthenticatedActor } from '../common/current-actor.decorator.js';

/**
 * Allows a request only for a platform super-admin: a user flagged
 * `isPlatformAdmin`, or whose email is in the `PLATFORM_ADMIN_EMAILS`
 * allowlist (used to bootstrap the first admin). Runs after the global JWT
 * guard, so `req.user` is already populated.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly allowlist: string[];

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.allowlist = (config.get<string>('PLATFORM_ADMIN_EMAILS') ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedActor }>();
    const actor = request.user;
    if (!actor?.userId) {
      throw new ForbiddenException('Platform administrator access required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { email: true, isPlatformAdmin: true },
    });

    const allowed =
      !!user &&
      (user.isPlatformAdmin ||
        (!!user.email && this.allowlist.includes(user.email.toLowerCase())));
    if (!allowed) {
      throw new ForbiddenException('Platform administrator access required');
    }
    return true;
  }
}
