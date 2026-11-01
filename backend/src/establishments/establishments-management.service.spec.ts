import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { jest } from '@jest/globals';
import { EstablishmentsManagementService } from './establishments-management.service.js';

// No-op subscription gate: quota enforcement has its own tests.
const subscriptions = {
  assertWithinEmployeeQuota: jest.fn(),
};

describe('EstablishmentsManagementService', () => {
  it('transfers ownership to an active member and audits the change', async () => {
    const tx = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'owner-membership',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'OWNER',
          permissions: {},
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    tx.establishmentMember.findFirst.mockResolvedValueOnce({
      id: 'target-membership',
      userId: 'target-user',
    });
    const service = new EstablishmentsManagementService(
      prisma as any,
      subscriptions as any,
    );

    await service.transferOwnership(
      'owner-user',
      'establishment-a',
      'target-membership',
    );

    expect(tx.establishmentMember.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'target-membership' },
      data: { role: 'OWNER' },
    });
    expect(tx.establishmentMember.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'owner-membership' },
      data: { role: 'MANAGER' },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: 'owner-user',
          action: 'ownership.transferred',
        }),
      }),
    );
  });

  it('scopes profile edits and audit records to the authorized establishment', async () => {
    const tx = {
      establishment: {
        update: jest.fn().mockResolvedValue({
          id: 'establishment-a',
          name: 'Updated salon',
        }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'OWNER',
          permissions: {},
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    await service.updateEstablishment('user-a', 'establishment-a', {
      name: ' Updated salon ',
    });

    expect(tx.establishment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'establishment-a' },
        data: expect.objectContaining({
          name: 'Updated salon',
          description: undefined,
          address: undefined,
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: 'user-a',
          establishmentId: 'establishment-a',
          action: 'establishment.updated',
        }),
      }),
    );
  });

  it('does not expose services when the tenant permission is explicitly disabled', async () => {
    const findMany = jest.fn();
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'MANAGER',
          permissions: { 'services.read': false },
        }),
      },
      service: { findMany },
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    await expect(
      service.listServices('user-a', 'establishment-a'),
    ).rejects.toThrow(
      new ForbiddenException('You do not have permission to services read'),
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it('searches and paginates customers within the authorized tenant', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 'customer-a', name: 'Alice', phoneNormalized: '+21620000000' },
      { id: 'customer-b', name: 'Alicia', phoneNormalized: '+21620000001' },
    ]);
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'MANAGER',
          permissions: {},
          employee: null,
        }),
      },
      customer: { findMany },
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    await expect(
      service.listCustomers('manager-a', 'establishment-a', {
        q: ' Alice ',
        limit: 1,
      }),
    ).resolves.toEqual({
      items: [
        { id: 'customer-a', name: 'Alice', phoneNormalized: '+21620000000' },
      ],
      nextCursor: 'customer-a',
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          establishmentId: 'establishment-a',
          OR: [
            { name: { contains: 'Alice', mode: 'insensitive' } },
            { phoneNormalized: { contains: 'Alice' } },
          ],
        }),
        take: 2,
      }),
    );
  });

  it('limits employee customer history to bookings assigned to that employee', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'EMPLOYEE',
          permissions: {},
          employee: { id: 'employee-a' },
        }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({ id: 'customer-a' }),
      },
      booking: { findMany },
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    await expect(
      service.listCustomerBookings(
        'employee-user',
        'establishment-a',
        'customer-a',
        {},
      ),
    ).resolves.toEqual({ items: [], nextCursor: null });
    expect(prisma.customer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'customer-a',
          establishmentId: 'establishment-a',
          bookings: { some: { employeeId: 'employee-a' } },
        }),
      }),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          establishmentId: 'establishment-a',
          customerId: 'customer-a',
          employeeId: 'employee-a',
        },
      }),
    );
  });

  it('writes a service and its audit event in one transaction', async () => {
    const tx = {
      service: {
        create: jest.fn().mockResolvedValue({
          id: 'service-a',
          name: 'Massage',
          durationMinutes: 45,
        }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'OWNER',
          permissions: {},
        }),
      },
      establishment: {
        findFirst: jest.fn().mockResolvedValue({ id: 'establishment-a' }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    const result = await service.createService('user-a', 'establishment-a', {
      name: ' Massage ',
      durationMinutes: 45,
      price: 42.5,
    });

    expect(result.id).toBe('service-a');
    expect(tx.service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          establishmentId: 'establishment-a',
          name: 'Massage',
          durationMinutes: 45,
          price: 42.5,
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalled();
  });

  it('rejects employee service assignments from another tenant before creating the employee', async () => {
    const employeeCreate = jest.fn();
    const tx = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({ id: 'membership-a' }),
      },
      service: { count: jest.fn().mockResolvedValue(0) },
      employee: { create: employeeCreate },
      employeeService: { createMany: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'OWNER',
          permissions: {},
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    await expect(
      service.createEmployee('user-a', 'establishment-a', {
        memberId: 'membership-a',
        displayName: 'Amira',
        serviceIds: ['service-from-b'],
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Every serviceId must identify an active service in this establishment',
      ),
    );
    expect(employeeCreate).not.toHaveBeenCalled();
  });

  it('creates a single-use employee invitation with a hashed token', async () => {
    const invitationCreate = jest
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: data.id, expiresAt: data.expiresAt }),
      );
    const tx = {
      establishmentMember: { findFirst: jest.fn().mockResolvedValue(null) },
      employeeInvitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: invitationCreate,
      },
      service: { count: jest.fn().mockResolvedValue(1) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'OWNER',
          permissions: {},
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    const result = await service.inviteEmployee('owner-a', 'establishment-a', {
      email: ' EMPLOYEE@EXAMPLE.COM ',
      displayName: ' Amira ',
      serviceIds: ['service-a'],
    });

    expect(result).toEqual(
      expect.objectContaining({
        email: 'employee@example.com',
        invitationToken: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    const stored = invitationCreate.mock.calls[0][0].data;
    expect(stored.email).toBe('employee@example.com');
    expect(stored.displayName).toBe('Amira');
    expect(stored.tokenHash).not.toEqual(
      Buffer.from(result.invitationToken, 'utf8'),
    );
    expect(tx.auditLog.create).toHaveBeenCalled();
  });

  it('replaces establishment hours and writes the audit record transactionally', async () => {
    const savedHour = {
      id: 'hour-a',
      dayOfWeek: 1,
      opensAt: new Date(Date.UTC(1970, 0, 1, 9)),
      closesAt: new Date(Date.UTC(1970, 0, 1, 17)),
    };
    const tx = {
      businessHour: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([savedHour]),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'OWNER',
          permissions: {},
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    await expect(
      service.replaceEstablishmentBusinessHours('user-a', 'establishment-a', {
        hours: [{ dayOfWeek: 1, opensAt: '09:00', closesAt: '17:00' }],
      }),
    ).resolves.toEqual([
      {
        id: 'hour-a',
        dayOfWeek: 1,
        opensAt: '09:00',
        closesAt: '17:00',
      },
    ]);
    expect(tx.businessHour.deleteMany).toHaveBeenCalledWith({
      where: { establishmentId: 'establishment-a', employeeId: null },
    });
    expect(tx.auditLog.create).toHaveBeenCalled();
  });

  it('rejects overlapping hours before changing the stored schedule', async () => {
    const transaction = jest.fn();
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'OWNER',
          permissions: {},
        }),
      },
      $transaction: transaction,
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    await expect(
      service.replaceEstablishmentBusinessHours('user-a', 'establishment-a', {
        hours: [
          { dayOfWeek: 1, opensAt: '09:00', closesAt: '12:00' },
          { dayOfWeek: 1, opensAt: '11:00', closesAt: '14:00' },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects time off that overlaps an active booking', async () => {
    const timeOffCreate = jest.fn();
    const tx = {
      employee: {
        findFirst: jest.fn().mockResolvedValue({ id: 'employee-a' }),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'employee-a' }]),
      booking: { count: jest.fn().mockResolvedValue(1) },
      timeOff: { create: timeOffCreate },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      establishmentMember: {
        findFirst: jest.fn().mockResolvedValue({
          role: 'OWNER',
          permissions: {},
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new EstablishmentsManagementService(prisma as any, subscriptions as any);

    await expect(
      service.createTimeOff('user-a', 'establishment-a', {
        employeeId: 'employee-a',
        startsAt: '2026-11-02T09:00:00Z',
        endsAt: '2026-11-02T10:00:00Z',
      }),
    ).rejects.toThrow(
      new ConflictException('Time off cannot overlap an active booking'),
    );
    expect(timeOffCreate).not.toHaveBeenCalled();
  });
});
