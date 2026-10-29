import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedActor } from '../common/current-actor.decorator.js';
import { PrismaService } from '../database/prisma.service.js';

interface AccessTokenPayload {
  sub: string;
  sid: string;
  iss: string;
  aud: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    if (Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error('JWT_ACCESS_SECRET must contain at least 32 bytes');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: 'booking-api',
      audience: 'booking-clients',
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedActor> {
    if (!payload.sub || !payload.sid || !payload.iss || !payload.aud) {
      throw new UnauthorizedException('Invalid access token claims');
    }

    const session = await this.prisma.authSession.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        rotatedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { status: 'ACTIVE' },
      },
      select: { id: true },
    });
    if (!session) {
      throw new UnauthorizedException('Session is no longer active');
    }

    return { userId: payload.sub, sessionId: payload.sid };
  }
}
