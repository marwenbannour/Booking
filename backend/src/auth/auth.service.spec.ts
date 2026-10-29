import { UnauthorizedException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { randomBytes, scryptSync } from 'node:crypto';
import { AuthService } from './auth.service.js';

function makePasswordHash(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

describe('AuthService', () => {
  const config = {
    get: (key: string) => (key === 'JWT_ACCESS_TTL_SECONDS' ? '600' : '604800'),
  };

  it('creates an owner account and establishment as one registration operation', async () => {
    const tx = {
      user: {
        create: jest.fn().mockResolvedValue({ id: 'user-id' }),
      },
      establishment: {
        create: jest.fn().mockResolvedValue({
          id: 'establishment-id',
          slug: 'salon-test',
          name: 'Salon Test',
        }),
      },
      establishmentMember: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const authSessionCreate = jest.fn().mockResolvedValue({ id: 'session-id' });
    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
      authSession: { create: authSessionCreate },
    };
    const service = new AuthService(
      prisma as any,
      { signAsync: jest.fn().mockResolvedValue('signed-token') } as any,
      config as any,
    );

    const result = await service.register({
      email: 'OWNER@EXAMPLE.COM',
      password: 'secure-password-123',
      establishmentName: ' Salon Test ',
      establishmentSlug: 'salon-test',
      locale: 'fr',
    });

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'owner@example.com',
          passwordHash: expect.stringMatching(/^scrypt\$16384\$8\$1\$/),
        }),
      }),
    );
    expect(tx.establishmentMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-id',
          establishmentId: 'establishment-id',
          role: 'OWNER',
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalled();
    expect(authSessionCreate).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        userId: 'user-id',
        establishment: {
          id: 'establishment-id',
          slug: 'salon-test',
          name: 'Salon Test',
        },
        accessToken: 'signed-token',
      }),
    );
  });

  it('authenticates case-insensitive email and creates a hashed refresh session', async () => {
    const passwordHash = makePasswordHash('secure-password-123');
    const authSessionCreate = jest.fn().mockResolvedValue({ id: 'session-id' });
    const signAsync = jest.fn().mockResolvedValue('signed-access-token');
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-id',
          passwordHash,
          status: 'ACTIVE',
        }),
      },
      authSession: { create: authSessionCreate },
    };
    const service = new AuthService(
      prisma as any,
      { signAsync } as any,
      config as any,
    );

    const result = await service.login(
      ' OWNER@EXAMPLE.COM ',
      'secure-password-123',
    );

    expect(result).toEqual({
      accessToken: 'signed-access-token',
      refreshToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 600,
    });
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { email: 'owner@example.com' },
            { phoneNormalized: 'OWNER@EXAMPLE.COM' },
          ],
        },
      }),
    );
    expect(authSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-id',
          refreshTokenHash: expect.any(Uint8Array),
          familyId: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      }),
    );
    expect(signAsync).toHaveBeenCalledWith(
      { sub: 'user-id', sid: 'session-id' },
      expect.objectContaining({
        issuer: 'booking-api',
        audience: 'booking-clients',
        expiresIn: 600,
      }),
    );
  });

  it('returns a generic authentication error for an unknown account', async () => {
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      authSession: { create: jest.fn() },
    };
    const service = new AuthService(
      prisma as any,
      { signAsync: jest.fn() } as any,
      config as any,
    );

    await expect(
      service.login('unknown@example.com', 'secure-password-123'),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    expect(prisma.authSession.create).not.toHaveBeenCalled();
  });

  it('creates an employee account and membership when a valid invitation is accepted', async () => {
    const invitation = {
      id: 'invitation-id',
      establishmentId: 'establishment-id',
      invitedByUserId: 'owner-id',
      email: 'employee@example.com',
      displayName: 'Amira',
      serviceIds: [],
      expiresAt: new Date(Date.now() + 60_000),
      acceptedAt: null,
      revokedAt: null,
    };
    const tx = {
      employeeInvitation: {
        findUnique: jest.fn().mockResolvedValue(invitation),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'employee-user-id' }),
      },
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'membership-id' }),
      },
      employee: {
        create: jest.fn().mockResolvedValue({ id: 'employee-id' }),
      },
      employeeService: { deleteMany: jest.fn() },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const authSessionCreate = jest.fn().mockResolvedValue({ id: 'session-id' });
    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
      authSession: { create: authSessionCreate },
    };
    const service = new AuthService(
      prisma as any,
      { signAsync: jest.fn().mockResolvedValue('signed-token') } as any,
      config as any,
    );

    const result = await service.acceptEmployeeInvitation({
      token: 'a'.repeat(43),
      password: 'secure-password-123',
    });

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'employee@example.com',
          status: 'ACTIVE',
          passwordHash: expect.stringMatching(/^scrypt\$16384\$8\$1\$/),
        }),
      }),
    );
    expect(tx.establishmentMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          establishmentId: 'establishment-id',
          userId: 'employee-user-id',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
        }),
      }),
    );
    expect(tx.employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberId: 'membership-id',
          displayName: 'Amira',
        }),
      }),
    );
    expect(tx.employeeInvitation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'invitation-id',
          acceptedAt: null,
          revokedAt: null,
        }),
      }),
    );
    expect(authSessionCreate).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        userId: 'employee-user-id',
        accessToken: 'signed-token',
        refreshToken: expect.any(String),
      }),
    );
  });

  it('only lets an existing account accept an invitation sent to its email', async () => {
    const invitation = {
      id: 'invitation-id',
      establishmentId: 'establishment-id',
      invitedByUserId: 'owner-id',
      email: 'employee@example.com',
      displayName: 'Amira',
      serviceIds: [],
      expiresAt: new Date(Date.now() + 60_000),
      acceptedAt: null,
      revokedAt: null,
    };
    const tx = {
      employeeInvitation: {
        findUnique: jest.fn().mockResolvedValue(invitation),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'employee-user-id',
          email: 'employee@example.com',
          status: 'ACTIVE',
        }),
      },
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'membership-id' }),
      },
      employee: {
        create: jest.fn().mockResolvedValue({ id: 'employee-id' }),
      },
      employeeService: { deleteMany: jest.fn() },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new AuthService(
      prisma as any,
      { signAsync: jest.fn() } as any,
      config as any,
    );

    await expect(
      service.acceptEmployeeInvitationForExistingUser(
        'employee-user-id',
        'a'.repeat(43),
      ),
    ).resolves.toEqual({
      userId: 'employee-user-id',
      employeeId: 'employee-id',
      membershipId: 'membership-id',
    });
    expect(tx.employeeInvitation.updateMany).toHaveBeenCalled();
  });

  it('rotates a refresh token and creates the next session in the same transaction', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'next-session' });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'session-id',
          userId: 'user-id',
          familyId: 'family-id',
          rotatedAt: null,
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          userStatus: 'ACTIVE',
        },
      ]),
      authSession: { updateMany, create },
    };
    const prisma = {
      authSession: {
        findUnique: jest.fn().mockResolvedValue({ id: 'session-id' }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const signAsync = jest.fn().mockResolvedValue('next-access-token');
    const service = new AuthService(
      prisma as any,
      { signAsync } as any,
      config as any,
    );

    const result = await service.refresh('a'.repeat(64));

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'session-id',
          rotatedAt: null,
          revokedAt: null,
        }),
      }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-id',
          familyId: 'family-id',
          refreshTokenHash: expect.any(Uint8Array),
        }),
      }),
    );
    expect(result).toEqual({
      accessToken: 'next-access-token',
      refreshToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 600,
    });
  });

  it('revokes the refresh-token family when a rotated token is reused', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'old-session',
          userId: 'user-id',
          familyId: 'family-id',
          rotatedAt: new Date(Date.now() - 1_000),
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          userStatus: 'ACTIVE',
        },
      ]),
      authSession: { updateMany },
    };
    const prisma = {
      authSession: {
        findUnique: jest.fn().mockResolvedValue({ id: 'old-session' }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new AuthService(
      prisma as any,
      { signAsync: jest.fn() } as any,
      config as any,
    );

    await expect(service.refresh('a'.repeat(64))).rejects.toThrow(
      new UnauthorizedException('Invalid or reused refresh token'),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyId: 'family-id', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      }),
    );
  });

  it('issues a reset token for a known email without revealing existence', async () => {
    const tx = {
      passwordResetToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'reset-1' }),
      },
    };
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'user-1' }) },
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    const service = new AuthService(
      prisma as any,
      { signAsync: jest.fn() } as any,
      config as any,
    );

    const result = await service.requestPasswordReset('OWNER@example.com ');

    expect(result.message).toContain('If an account matches');
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ email: 'owner@example.com' }),
      }),
    );
    expect(tx.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: expect.any(Uint8Array),
          expiresAt: expect.any(Date),
        }),
      }),
    );
  });

  it('returns the same response and does nothing for an unknown email', async () => {
    const transaction = jest.fn();
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: transaction,
    };
    const service = new AuthService(
      prisma as any,
      { signAsync: jest.fn() } as any,
      config as any,
    );

    const result = await service.requestPasswordReset('nobody@example.com');

    expect(result.message).toContain('If an account matches');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('resets the password, consumes the token, and revokes sessions', async () => {
    const tx = {
      passwordResetToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reset-1',
          userId: 'user-1',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
      authSession: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    const service = new AuthService(
      prisma as any,
      { signAsync: jest.fn() } as any,
      config as any,
    );

    await service.resetPassword('a'.repeat(43), 'brand-new-password-123');

    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: {
          passwordHash: expect.stringMatching(/^scrypt\$16384\$8\$1\$/),
        },
      }),
    );
    expect(tx.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { usedAt: expect.any(Date) } }),
    );
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      }),
    );
  });

  it('rejects an expired or unknown reset token', async () => {
    const tx = {
      passwordResetToken: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      user: { update: jest.fn() },
      authSession: { updateMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    const service = new AuthService(
      prisma as any,
      { signAsync: jest.fn() } as any,
      config as any,
    );

    await expect(
      service.resetPassword('b'.repeat(43), 'brand-new-password-123'),
    ).rejects.toThrow('Invalid or expired reset token');
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});
