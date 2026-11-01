import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { AuthenticatedActor } from '../common/current-actor.decorator.js';
import type { AcceptEmployeeInvitationDto } from './dto/accept-employee-invitation.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

const ACCESS_TOKEN_ISSUER = 'booking-api';
const ACCESS_TOKEN_AUDIENCE = 'booking-clients';
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;

export interface SessionTokenResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

interface LockedRefreshSession {
  id: string;
  userId: string;
  familyId: string;
  rotatedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
  userStatus: string;
}

@Injectable()
export class AuthService {
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlSeconds: number;
  private readonly passwordResetTtlSeconds: number;
  private readonly emailChangeTtlSeconds: number;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
    private readonly email: EmailService,
  ) {
    this.accessTokenTtlSeconds = this.readPositiveInteger(
      config.get<string>('JWT_ACCESS_TTL_SECONDS') ?? '600',
      'JWT_ACCESS_TTL_SECONDS',
    );
    this.refreshTokenTtlSeconds = this.readPositiveInteger(
      config.get<string>('JWT_REFRESH_TTL_SECONDS') ?? '604800',
      'JWT_REFRESH_TTL_SECONDS',
    );
    this.passwordResetTtlSeconds = this.readPositiveInteger(
      config.get<string>('PASSWORD_RESET_TTL_SECONDS') ?? '1800',
      'PASSWORD_RESET_TTL_SECONDS',
    );
    this.emailChangeTtlSeconds = this.readPositiveInteger(
      config.get<string>('EMAIL_CHANGE_TTL_SECONDS') ?? '3600',
      'EMAIL_CHANGE_TTL_SECONDS',
    );
  }

  private readPositiveInteger(value: string, key: string): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }
    return parsed;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await this.derivePasswordHash(password, salt);

    return [
      'scrypt',
      SCRYPT_COST,
      SCRYPT_BLOCK_SIZE,
      SCRYPT_PARALLELIZATION,
      salt.toString('base64url'),
      hash.toString('base64url'),
    ].join('$');
  }

  private derivePasswordHash(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      nodeScrypt(
        password,
        salt,
        SCRYPT_KEY_LENGTH,
        {
          N: SCRYPT_COST,
          r: SCRYPT_BLOCK_SIZE,
          p: SCRYPT_PARALLELIZATION,
          maxmem: 64 * 1024 * 1024,
        },
        (error, derivedKey) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(derivedKey);
        },
      );
    });
  }

  private async verifyPassword(
    password: string,
    encoded: string,
  ): Promise<boolean> {
    const [algorithm, n, r, p, saltValue, hashValue, extra] =
      encoded.split('$');
    if (
      algorithm !== 'scrypt' ||
      extra !== undefined ||
      n !== String(SCRYPT_COST) ||
      r !== String(SCRYPT_BLOCK_SIZE) ||
      p !== String(SCRYPT_PARALLELIZATION) ||
      !saltValue ||
      !hashValue
    ) {
      return false;
    }

    let salt: Buffer;
    let expectedHash: Buffer;
    try {
      salt = Buffer.from(saltValue, 'base64url');
      expectedHash = Buffer.from(hashValue, 'base64url');
    } catch {
      return false;
    }
    if (salt.length !== 16 || expectedHash.length !== SCRYPT_KEY_LENGTH) {
      return false;
    }

    const actualHash = await this.derivePasswordHash(password, salt);

    return timingSafeEqual(actualHash, expectedHash);
  }

  private hashRefreshToken(token: string): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(createHash('sha256').update(token, 'utf8').digest());
  }

  private async issueTokens(
    userId: string,
    familyId = randomBytes(16).toString('hex'),
  ): Promise<SessionTokenResult> {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlSeconds * 1000);

    const session = await this.prisma.authSession.create({
      data: {
        id: randomUUID(),
        userId,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        familyId: this.uuidFromHex(familyId),
        expiresAt,
      },
      select: { id: true },
    });

    const accessToken = await this.jwt.signAsync(
      { sub: userId, sid: session.id },
      {
        expiresIn: this.accessTokenTtlSeconds,
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtlSeconds,
    };
  }

  private uuidFromHex(value: string): string {
    if (/^[0-9a-f]{32}$/i.test(value)) {
      return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
    }
    return value;
  }

  async register(input: RegisterDto) {
    const email = input.email?.trim().toLowerCase() || null;
    const phone = input.phone?.trim() || null;
    if (!email && !phone) {
      throw new BadRequestException(
        'An email address or phone number is required',
      );
    }

    const passwordHash = await this.hashPassword(input.password);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            phoneNormalized: phone,
            passwordHash,
            preferredLocale: input.locale ?? 'fr',
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        const establishment = await tx.establishment.create({
          data: {
            slug: input.establishmentSlug,
            name: input.establishmentName.trim(),
            locale: input.locale ?? 'fr',
          },
          select: { id: true, slug: true, name: true },
        });
        await tx.establishmentMember.create({
          data: {
            establishmentId: establishment.id,
            userId: createdUser.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        });
        await tx.auditLog.create({
          data: {
            establishmentId: establishment.id,
            actorUserId: createdUser.id,
            action: 'establishment.created',
            targetType: 'ESTABLISHMENT',
            targetId: establishment.id,
            metadata: { source: 'self_registration' },
          },
        });

        return { ...createdUser, establishment };
      });

      const tokens = await this.issueTokens(user.id);
      return { userId: user.id, establishment: user.establishment, ...tokens };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'An account with this email or phone, or an establishment with this slug, already exists',
        );
      }
      throw error;
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }

  async login(identifier: string, password: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { phoneNormalized: identifier.trim() },
        ],
      },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });

    const validPassword = user
      ? await this.verifyPassword(password, user.passwordHash)
      : await this.verifyPassword(
          password,
          'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        );

    if (!user || user.status !== 'ACTIVE' || !validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id);
  }

  async refresh(refreshToken: string): Promise<SessionTokenResult> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const existing = await this.prisma.authSession.findUnique({
      where: { refreshTokenHash: tokenHash },
      select: { id: true },
    });
    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const outcome = await this.prisma.$transaction(async (tx) => {
      const sessions = await tx.$queryRaw<LockedRefreshSession[]>`
        SELECT
          s.id,
          s.user_id AS "userId",
          s.family_id AS "familyId",
          s.rotated_at AS "rotatedAt",
          s.revoked_at AS "revokedAt",
          s.expires_at AS "expiresAt",
          u.status::text AS "userStatus"
        FROM auth_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.id = ${existing.id}::uuid
        FOR UPDATE OF s
      `;
      const session = sessions[0];
      if (!session) {
        return { status: 'invalid' as const };
      }

      if (session.rotatedAt || session.revokedAt) {
        await tx.authSession.updateMany({
          where: { familyId: session.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return { status: 'reuse' as const };
      }
      if (session.expiresAt <= new Date() || session.userStatus !== 'ACTIVE') {
        return { status: 'invalid' as const };
      }

      const rotated = await tx.authSession.updateMany({
        where: {
          id: session.id,
          rotatedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { rotatedAt: new Date(), lastUsedAt: new Date() },
      });
      if (rotated.count !== 1) {
        await tx.authSession.updateMany({
          where: { familyId: session.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return { status: 'reuse' as const };
      }

      const nextRefreshToken = randomBytes(48).toString('base64url');
      const nextSession = await tx.authSession.create({
        data: {
          userId: session.userId,
          refreshTokenHash: this.hashRefreshToken(nextRefreshToken),
          familyId: session.familyId,
          expiresAt: new Date(Date.now() + this.refreshTokenTtlSeconds * 1000),
        },
        select: { id: true },
      });

      return {
        status: 'rotated' as const,
        userId: session.userId,
        sessionId: nextSession.id,
        refreshToken: nextRefreshToken,
      };
    });

    if (outcome.status !== 'rotated') {
      throw new UnauthorizedException('Invalid or reused refresh token');
    }

    const accessToken = await this.jwt.signAsync(
      { sub: outcome.userId, sid: outcome.sessionId },
      {
        expiresIn: this.accessTokenTtlSeconds,
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      },
    );

    return {
      accessToken,
      refreshToken: outcome.refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtlSeconds,
    };
  }

  async logout(actor: AuthenticatedActor): Promise<void> {
    const session = await this.prisma.authSession.findFirst({
      where: { id: actor.sessionId, userId: actor.userId },
      select: { familyId: true },
    });
    if (!session) {
      return;
    }

    await this.prisma.authSession.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNormalized: true,
        preferredLocale: true,
        memberships: {
          where: { status: 'ACTIVE' },
          select: {
            role: true,
            establishment: {
              select: { id: true, slug: true, name: true, status: true },
            },
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Account is no longer available');
    }
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileDto) {
    try {
      return await this.performProfileUpdate(userId, input);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'This email address or phone number is already in use',
        );
      }
      throw error;
    }
  }

  private async performProfileUpdate(userId: string, input: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phoneNormalized: true,
        preferredLocale: true,
        passwordHash: true,
      },
    });
    if (!user || !(await this.verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const email =
      input.email === undefined
        ? user.email
        : input.email?.trim().toLowerCase() || null;
    const phone =
      input.phone === undefined ? user.phoneNormalized : input.phone?.trim() || null;
    if (!email && !phone) {
      throw new BadRequestException(
        'At least an email address or phone number must remain on the account',
      );
    }

    let emailVerificationRequired = false;
    if (email !== user.email && email) {
      const existing = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('This email address is already in use');
      }

      const rawToken = randomBytes(32).toString('base64url');
      const expiresAt = new Date(
        Date.now() + this.emailChangeTtlSeconds * 1000,
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.emailChangeToken.updateMany({
          where: { userId, usedAt: null },
          data: { usedAt: new Date() },
        });
        await tx.emailChangeToken.create({
          data: {
            userId,
            email,
            tokenHash: this.hashResetToken(rawToken),
            expiresAt,
          },
        });
        await tx.user.update({
          where: { id: userId },
          data: {
            phoneNormalized: phone,
            preferredLocale: input.preferredLocale,
          },
        });
      });
      await this.email.sendEmailChangeVerification(email, rawToken);
      emailVerificationRequired = true;
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email,
          phoneNormalized: phone,
          preferredLocale: input.preferredLocale,
        },
      });
    }

    return {
      profile: await this.getMe(userId),
      emailVerificationRequired,
      message: emailVerificationRequired
        ? 'A verification link was sent to the new email address.'
        : 'Account details updated.',
    };
  }

  async confirmEmailChange(token: string): Promise<{ message: string }> {
    const tokenHash = this.hashResetToken(token);
    try {
      await this.prisma.$transaction(async (tx) => {
        const record = await tx.emailChangeToken.findUnique({
          where: { tokenHash },
          select: {
            id: true,
            userId: true,
            email: true,
            usedAt: true,
            expiresAt: true,
          },
        });
        if (!record || record.usedAt || record.expiresAt <= new Date()) {
          throw new BadRequestException('Invalid or expired email verification token');
        }

        const claimed = await tx.emailChangeToken.updateMany({
          where: {
            id: record.id,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { usedAt: new Date() },
        });
        if (claimed.count !== 1) {
          throw new BadRequestException('Invalid or expired email verification token');
        }
        const updatedUser = await tx.user.updateMany({
          where: { id: record.userId, status: 'ACTIVE' },
          data: { email: record.email },
        });
        if (updatedUser.count !== 1) {
          throw new BadRequestException(
            'Email verification is not available for this account',
          );
        }
        await tx.emailChangeToken.updateMany({
          where: { userId: record.userId, usedAt: null },
          data: { usedAt: new Date() },
        });
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('This email address is already in use');
      }
      throw error;
    }
    return { message: 'Email address verified and updated.' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, status: true },
    });
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      !(await this.verifyPassword(currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
    return { message: 'Password changed. Please sign in again.' };
  }

  async closeAccount(
    userId: string,
    currentPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, status: true },
    });
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      !(await this.verifyPassword(currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.prisma.$transaction(async (tx) => {
      const membershipEstablishments =
        await tx.establishmentMember.findMany({
          where: { userId, status: 'ACTIVE' },
          select: { establishmentId: true },
        });
      const establishmentIds = [
        ...new Set(
          membershipEstablishments.map(({ establishmentId }) => establishmentId),
        ),
      ].sort();
      for (const establishmentId of establishmentIds) {
        await tx.$queryRaw`
          SELECT id
          FROM establishments
          WHERE id = ${establishmentId}::uuid
          FOR UPDATE
        `;
      }

      const memberships = await tx.establishmentMember.findMany({
        where: { userId, status: 'ACTIVE' },
        select: {
          id: true,
          establishmentId: true,
          role: true,
          establishment: { select: { status: true } },
        },
      });
      for (const membership of memberships) {
        if (membership.role !== 'OWNER' || membership.establishment.status !== 'ACTIVE') {
          continue;
        }
        const otherOwners = await tx.establishmentMember.count({
          where: {
            establishmentId: membership.establishmentId,
            userId: { not: userId },
            role: 'OWNER',
            status: 'ACTIVE',
          },
        });
        if (otherOwners === 0) {
          throw new ConflictException(
            'Transfer ownership of each active establishment before closing this account',
          );
        }
      }

      const memberIds = memberships.map(({ id }) => id);
      await tx.establishmentMember.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'INACTIVE' },
      });
      if (memberIds.length > 0) {
        await tx.employee.updateMany({
          where: { memberId: { in: memberIds } },
          data: { isActive: false },
        });
      }
      if (memberships.length > 0) {
        await tx.auditLog.createMany({
          data: memberships.map(({ establishmentId }) => ({
            actorUserId: userId,
            establishmentId,
            action: 'account.disabled',
            targetType: 'USER',
            targetId: userId,
            metadata: { reason: 'self_service_account_closure' },
          })),
        });
      }
      const disabledUser = await tx.user.updateMany({
        where: { id: userId, status: 'ACTIVE' },
        data: { status: 'DISABLED' },
      });
      if (disabledUser.count !== 1) {
        throw new ConflictException('Account is already closed');
      }
      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return {
      message: 'Account closed. Business records are retained for audit purposes.',
    };
  }

  private hashResetToken(token: string): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(createHash('sha256').update(token, 'utf8').digest());
  }

  /**
   * Issues a single-use, hashed password-reset token for the account with this
   * email. Always returns the same generic response so the endpoint does not
   * reveal whether an account exists.
   */
  async requestPasswordReset(email?: string): Promise<{ message: string }> {
    const generic = {
      message:
        'If an account matches, a password reset link has been sent to its email.',
    };
    const normalized = email?.trim().toLowerCase();
    if (!normalized) {
      return generic;
    }

    const user = await this.prisma.user.findFirst({
      where: { email: normalized, status: { in: ['ACTIVE', 'INVITED'] } },
      select: { id: true },
    });
    if (!user) {
      return generic;
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashResetToken(rawToken);
    const expiresAt = new Date(
      Date.now() + this.passwordResetTtlSeconds * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      // Keep a single active token per user.
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });
    });

    try {
      await this.email.sendPasswordReset(normalized, rawToken);
    } catch (error) {
      this.logger.error(
        'Password reset email delivery failed',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return generic;
  }

  /**
   * Resets the password given a valid, unexpired, single-use token. Marks the
   * token used and revokes every active session for the account so any
   * compromised refresh tokens stop working.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = this.hashResetToken(token);
    const passwordHash = await this.hashPassword(newPassword);

    await this.prisma.$transaction(async (tx) => {
      const record = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, usedAt: true, expiresAt: true },
      });
      if (!record || record.usedAt || record.expiresAt <= new Date()) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: record.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('Invalid or expired reset token');
      }
      const updatedUser = await tx.user.updateMany({
        where: {
          id: record.userId,
          status: { in: ['ACTIVE', 'INVITED'] },
        },
        data: { passwordHash },
      });
      if (updatedUser.count !== 1) {
        throw new BadRequestException('Invalid or expired reset token');
      }
      await tx.authSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { message: 'Password has been reset. Please sign in again.' };
  }

  private hashInvitationToken(token: string): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(createHash('sha256').update(token, 'utf8').digest());
  }

  private async findUsableInvitation(
    tx: Prisma.TransactionClient,
    token: string,
  ) {
    const invitation = await tx.employeeInvitation.findUnique({
      where: { tokenHash: this.hashInvitationToken(token) },
      select: {
        id: true,
        establishmentId: true,
        invitedByUserId: true,
        email: true,
        displayName: true,
        serviceIds: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
      },
    });
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired employee invitation');
    }

    return invitation;
  }

  private async claimInvitation(
    tx: Prisma.TransactionClient,
    invitationId: string,
  ) {
    const claim = await tx.employeeInvitation.updateMany({
      where: {
        id: invitationId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { acceptedAt: new Date() },
    });
    if (claim.count !== 1) {
      throw new UnauthorizedException('Invalid or expired employee invitation');
    }
  }

  private async attachInvitedEmployee(
    tx: Prisma.TransactionClient,
    invitation: Awaited<ReturnType<AuthService['findUsableInvitation']>>,
    userId: string,
  ) {
    if (invitation.serviceIds.length) {
      const activeServices = await tx.service.count({
        where: {
          establishmentId: invitation.establishmentId,
          id: { in: invitation.serviceIds },
          isActive: true,
        },
      });
      if (activeServices !== invitation.serviceIds.length) {
        throw new ConflictException(
          'An assigned service is no longer available',
        );
      }
    }

    const existingMembership = await tx.establishmentMember.findFirst({
      where: { establishmentId: invitation.establishmentId, userId },
      select: {
        id: true,
        role: true,
        status: true,
        employee: { select: { id: true } },
      },
    });
    if (existingMembership?.status === 'ACTIVE') {
      throw new ConflictException(
        'This account is already an active member of the establishment',
      );
    }
    if (
      existingMembership &&
      (existingMembership.role !== 'EMPLOYEE' || !existingMembership.employee)
    ) {
      throw new ConflictException(
        'This account has an incompatible membership in the establishment',
      );
    }

    const membership = existingMembership
      ? await tx.establishmentMember.update({
          where: { id: existingMembership.id },
          data: { role: 'EMPLOYEE', status: 'ACTIVE' },
          select: { id: true },
        })
      : await tx.establishmentMember.create({
          data: {
            establishmentId: invitation.establishmentId,
            userId,
            role: 'EMPLOYEE',
            status: 'ACTIVE',
          },
          select: { id: true },
        });

    const employee = existingMembership?.employee
      ? await tx.employee.update({
          where: { id: existingMembership.employee.id },
          data: { displayName: invitation.displayName, isActive: true },
          select: { id: true },
        })
      : await tx.employee.create({
          data: {
            establishmentId: invitation.establishmentId,
            memberId: membership.id,
            displayName: invitation.displayName,
          },
          select: { id: true },
        });

    await tx.employeeService.deleteMany({
      where: { employeeId: employee.id },
    });
    if (invitation.serviceIds.length) {
      await tx.employeeService.createMany({
        data: invitation.serviceIds.map((serviceId) => ({
          employeeId: employee.id,
          serviceId,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        establishmentId: invitation.establishmentId,
        actorUserId: userId,
        action: 'employee.invitation_accepted',
        targetType: 'EMPLOYEE',
        targetId: employee.id,
        metadata: { invitationId: invitation.id },
      },
    });
    return { employeeId: employee.id, membershipId: membership.id };
  }

  async acceptEmployeeInvitation(
    input: AcceptEmployeeInvitationDto,
  ): Promise<{ userId: string } & SessionTokenResult> {
    const passwordHash = await this.hashPassword(input.password);
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const invitation = await this.findUsableInvitation(tx, input.token);
        const existingUser = await tx.user.findUnique({
          where: { email: invitation.email },
          select: { id: true },
        });
        if (existingUser) {
          throw new ConflictException(
            'An account already uses this email; sign in to accept the invitation',
          );
        }
        await this.claimInvitation(tx, invitation.id);
        const user = await tx.user.create({
          data: {
            email: invitation.email,
            passwordHash,
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        const employee = await this.attachInvitedEmployee(
          tx,
          invitation,
          user.id,
        );
        return { userId: user.id, ...employee };
      });

      return {
        userId: result.userId,
        ...(await this.issueTokens(result.userId)),
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'An account with this email already exists; sign in to accept the invitation',
        );
      }
      throw error;
    }
  }

  async acceptEmployeeInvitationForExistingUser(userId: string, token: string) {
    return this.prisma.$transaction(async (tx) => {
      const [invitation, user] = await Promise.all([
        this.findUsableInvitation(tx, token),
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, status: true },
        }),
      ]);
      if (
        !user ||
        user.status !== 'ACTIVE' ||
        user.email?.toLowerCase() !== invitation.email
      ) {
        throw new UnauthorizedException(
          'The authenticated account does not match this invitation',
        );
      }
      await this.claimInvitation(tx, invitation.id);
      return {
        userId,
        ...(await this.attachInvitedEmployee(tx, invitation, userId)),
      };
    });
  }
}
