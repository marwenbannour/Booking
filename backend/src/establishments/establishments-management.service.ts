import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import type { BusinessHourEntryDto } from './dto/business-hours.dto.js';
import type { SetBusinessHoursDto } from './dto/business-hours.dto.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { CreateEmployeeInvitationDto } from './dto/create-employee-invitation.dto.js';
import type { CreateServiceDto } from './dto/create-service.dto.js';
import type { CreateTimeOffDto } from './dto/create-time-off.dto.js';
import type { ListTimeOffsQueryDto } from './dto/list-time-offs-query.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import type { UpdateEstablishmentDto } from './dto/update-establishment.dto.js';
import type { UpdateServiceDto } from './dto/update-service.dto.js';

type Permission =
  | 'establishments.read'
  | 'establishments.write'
  | 'services.read'
  | 'services.write'
  | 'employees.read'
  | 'employees.write'
  | 'availability.read'
  | 'availability.write'
  | 'customers.read';

interface Membership {
  role: string;
  permissions: unknown;
}

@Injectable()
export class EstablishmentsManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  private async requireMembership(userId: string, establishmentId: string) {
    const membership = await this.prisma.establishmentMember.findFirst({
      where: {
        establishmentId,
        userId,
        status: 'ACTIVE',
        establishment: { status: 'ACTIVE' },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this establishment',
      );
    }

    return membership;
  }

  private assertPermission(membership: Membership, permission: Permission) {
    const permissions =
      membership.permissions &&
      typeof membership.permissions === 'object' &&
      !Array.isArray(membership.permissions)
        ? (membership.permissions as Record<string, unknown>)
        : {};
    const aliases = [permission, permission.replace('.', ':')];
    const explicit = aliases
      .filter((key) => Object.hasOwn(permissions, key))
      .map((key) => permissions[key])[0];
    const isRead = permission.endsWith('.read');
    const defaultAllowed = isRead
      ? ['OWNER', 'MANAGER', 'EMPLOYEE'].includes(membership.role)
      : ['OWNER', 'MANAGER'].includes(membership.role);

    if (explicit === false || (explicit !== true && !defaultAllowed)) {
      throw new ForbiddenException(
        `You do not have permission to ${permission.replace('.', ' ')}`,
      );
    }
  }

  private async authorize(
    userId: string,
    establishmentId: string,
    permission: Permission,
  ) {
    const membership = await this.requireMembership(userId, establishmentId);
    this.assertPermission(membership, permission);
  }

  async transferOwnership(
    userId: string,
    establishmentId: string,
    targetMembershipId: string,
  ) {
    const current = await this.requireMembership(userId, establishmentId);
    if (current.role !== 'OWNER') {
      throw new ForbiddenException('Only an owner can transfer ownership');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM establishments
        WHERE id = ${establishmentId}::uuid
        FOR UPDATE
      `;
      const target = await tx.establishmentMember.findFirst({
        where: {
          id: targetMembershipId,
          establishmentId,
          status: 'ACTIVE',
          role: { in: ['MANAGER', 'EMPLOYEE'] },
        },
        select: { id: true, userId: true },
      });
      if (!target) {
        throw new NotFoundException(
          'The new owner must be an active member of this establishment',
        );
      }

      const currentMembership = await tx.establishmentMember.findFirst({
        where: {
          establishmentId,
          userId,
          status: 'ACTIVE',
          role: 'OWNER',
        },
        select: { id: true },
      });
      if (!currentMembership) {
        throw new ForbiddenException('Only an active owner can transfer ownership');
      }

      await tx.establishmentMember.update({
        where: { id: target.id },
        data: { role: 'OWNER' },
      });
      await tx.establishmentMember.update({
        where: { id: currentMembership.id },
        data: { role: 'MANAGER' },
      });
      await this.recordAudit(
        userId,
        establishmentId,
        'ownership.transferred',
        'ESTABLISHMENT_MEMBER',
        target.id,
        { previousOwnerUserId: userId, newOwnerUserId: target.userId },
        tx,
      );
      return {
        establishmentId,
        previousOwnerUserId: userId,
        newOwnerUserId: target.userId,
      };
    });
  }

  private async recordAudit(
    userId: string,
    establishmentId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata: Record<string, unknown> = {},
    database: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    await database.auditLog.create({
      data: {
        actorUserId: userId,
        establishmentId,
        action,
        targetType,
        targetId,
        metadata: metadata as Prisma.InputJsonObject,
      },
    });
  }

  private formatTimeOfDay(value: Date): string {
    return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
  }

  private formatBusinessHours<T extends { opensAt: Date; closesAt: Date }>(
    hours: T[],
  ) {
    return hours.map(({ opensAt, closesAt, ...hour }) => ({
      ...hour,
      opensAt: this.formatTimeOfDay(opensAt),
      closesAt: this.formatTimeOfDay(closesAt),
    }));
  }

  private validateBusinessHours(hours: BusinessHourEntryDto[]) {
    const sortedHours = [...hours].sort(
      (left, right) =>
        left.dayOfWeek - right.dayOfWeek ||
        left.opensAt.localeCompare(right.opensAt),
    );
    let previous: BusinessHourEntryDto | undefined;

    for (const hour of sortedHours) {
      if (hour.closesAt <= hour.opensAt) {
        throw new BadRequestException(
          'Each business-hour interval must close after it opens on the same day',
        );
      }
      if (
        previous?.dayOfWeek === hour.dayOfWeek &&
        hour.opensAt < previous.closesAt
      ) {
        throw new BadRequestException(
          'Business-hour intervals on the same day must not overlap',
        );
      }
      previous = hour;
    }
  }

  private timeOfDayToDate(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return new Date(Date.UTC(1970, 0, 1, hours, minutes));
  }

  async getEstablishmentBusinessHours(userId: string, establishmentId: string) {
    await this.authorize(userId, establishmentId, 'availability.read');
    const hours = await this.prisma.businessHour.findMany({
      where: { establishmentId, employeeId: null },
      orderBy: [{ dayOfWeek: 'asc' }, { opensAt: 'asc' }],
      select: {
        id: true,
        dayOfWeek: true,
        opensAt: true,
        closesAt: true,
      },
    });
    return this.formatBusinessHours(hours);
  }

  async replaceEstablishmentBusinessHours(
    userId: string,
    establishmentId: string,
    input: SetBusinessHoursDto,
  ) {
    await this.authorize(userId, establishmentId, 'availability.write');
    this.validateBusinessHours(input.hours);

    return this.prisma.$transaction(async (tx) => {
      await tx.businessHour.deleteMany({
        where: { establishmentId, employeeId: null },
      });
      await tx.businessHour.createMany({
        data: input.hours.map((hour) => ({
          establishmentId,
          employeeId: null,
          dayOfWeek: hour.dayOfWeek,
          opensAt: this.timeOfDayToDate(hour.opensAt),
          closesAt: this.timeOfDayToDate(hour.closesAt),
        })),
      });
      const savedHours = await tx.businessHour.findMany({
        where: { establishmentId, employeeId: null },
        orderBy: [{ dayOfWeek: 'asc' }, { opensAt: 'asc' }],
        select: {
          id: true,
          dayOfWeek: true,
          opensAt: true,
          closesAt: true,
        },
      });
      await this.recordAudit(
        userId,
        establishmentId,
        'business_hours.replaced',
        'ESTABLISHMENT',
        establishmentId,
        { intervalCount: input.hours.length },
        tx,
      );
      return this.formatBusinessHours(savedHours);
    });
  }

  async getEmployeeBusinessHours(
    userId: string,
    establishmentId: string,
    employeeId: string,
  ) {
    await this.authorize(userId, establishmentId, 'availability.read');
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, establishmentId },
      select: { id: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    const hours = await this.prisma.businessHour.findMany({
      where: { establishmentId, employeeId },
      orderBy: [{ dayOfWeek: 'asc' }, { opensAt: 'asc' }],
      select: {
        id: true,
        dayOfWeek: true,
        opensAt: true,
        closesAt: true,
      },
    });
    return this.formatBusinessHours(hours);
  }

  async replaceEmployeeBusinessHours(
    userId: string,
    establishmentId: string,
    employeeId: string,
    input: SetBusinessHoursDto,
  ) {
    await this.authorize(userId, establishmentId, 'availability.write');
    this.validateBusinessHours(input.hours);
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({
        where: { id: employeeId, establishmentId },
        select: { id: true },
      });
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }
      await tx.businessHour.deleteMany({
        where: { establishmentId, employeeId },
      });
      await tx.businessHour.createMany({
        data: input.hours.map((hour) => ({
          establishmentId,
          employeeId,
          dayOfWeek: hour.dayOfWeek,
          opensAt: this.timeOfDayToDate(hour.opensAt),
          closesAt: this.timeOfDayToDate(hour.closesAt),
        })),
      });
      const savedHours = await tx.businessHour.findMany({
        where: { establishmentId, employeeId },
        orderBy: [{ dayOfWeek: 'asc' }, { opensAt: 'asc' }],
        select: {
          id: true,
          dayOfWeek: true,
          opensAt: true,
          closesAt: true,
        },
      });
      await this.recordAudit(
        userId,
        establishmentId,
        'employee_business_hours.replaced',
        'EMPLOYEE',
        employeeId,
        { intervalCount: input.hours.length },
        tx,
      );
      return this.formatBusinessHours(savedHours);
    });
  }

  async listTimeOffs(
    userId: string,
    establishmentId: string,
    filters: ListTimeOffsQueryDto,
  ) {
    await this.authorize(userId, establishmentId, 'availability.read');
    const from = filters.from ? new Date(filters.from) : undefined;
    const to = filters.to ? new Date(filters.to) : undefined;
    if (from && to && from >= to) {
      throw new BadRequestException('from must be earlier than to');
    }
    return this.prisma.timeOff.findMany({
      where: {
        establishmentId,
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(to ? { startsAt: { lt: to } } : {}),
        ...(from ? { endsAt: { gt: from } } : {}),
      },
      orderBy: { startsAt: 'asc' },
      take: 100,
      select: {
        id: true,
        employeeId: true,
        startsAt: true,
        endsAt: true,
        reason: true,
        createdAt: true,
      },
    });
  }

  async createTimeOff(
    userId: string,
    establishmentId: string,
    input: CreateTimeOffDto,
  ) {
    await this.authorize(userId, establishmentId, 'availability.write');
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (startsAt >= endsAt) {
      throw new BadRequestException('endsAt must be later than startsAt');
    }

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({
        where: { id: input.employeeId, establishmentId, isActive: true },
        select: { id: true },
      });
      if (!employee) {
        throw new NotFoundException('Active employee not found');
      }
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM employees
        WHERE id = ${input.employeeId}::uuid
          AND establishment_id = ${establishmentId}::uuid
        FOR UPDATE
      `;
      const overlappingBookings = await tx.booking.count({
        where: {
          establishmentId,
          employeeId: input.employeeId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });
      if (overlappingBookings > 0) {
        throw new ConflictException(
          'Time off cannot overlap an active booking',
        );
      }
      const timeOff = await tx.timeOff.create({
        data: {
          establishmentId,
          employeeId: input.employeeId,
          startsAt,
          endsAt,
          reason: input.reason?.trim() || null,
        },
        select: {
          id: true,
          employeeId: true,
          startsAt: true,
          endsAt: true,
          reason: true,
          createdAt: true,
        },
      });
      await this.recordAudit(
        userId,
        establishmentId,
        'time_off.created',
        'TIME_OFF',
        timeOff.id,
        { employeeId: input.employeeId },
        tx,
      );
      return timeOff;
    });
  }

  async deleteTimeOff(
    userId: string,
    establishmentId: string,
    timeOffId: string,
  ) {
    await this.authorize(userId, establishmentId, 'availability.write');
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.timeOff.deleteMany({
        where: { id: timeOffId, establishmentId },
      });
      if (result.count === 0) {
        throw new NotFoundException('Time off not found');
      }
      await this.recordAudit(
        userId,
        establishmentId,
        'time_off.deleted',
        'TIME_OFF',
        timeOffId,
        {},
        tx,
      );
      return { id: timeOffId, deleted: true };
    });
  }

  private validateTimezone(timezone: string) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    } catch (error) {
      if (error instanceof RangeError) {
        throw new BadRequestException('timezone must be a valid IANA timezone');
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

  private isMissingRecordError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2025'
    );
  }

  async getEstablishment(userId: string, establishmentId: string) {
    await this.authorize(userId, establishmentId, 'establishments.read');
    const establishment = await this.prisma.establishment.findFirst({
      where: { id: establishmentId },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        address: true,
        timezone: true,
        currency: true,
        locale: true,
        minimumBookingNoticeMinutes: true,
        maximumBookingDays: true,
        cancellationNoticeHours: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }
    return establishment;
  }

  async updateEstablishment(
    userId: string,
    establishmentId: string,
    input: UpdateEstablishmentDto,
  ) {
    await this.authorize(userId, establishmentId, 'establishments.write');
    if (input.timezone) {
      this.validateTimezone(input.timezone);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const establishment = await tx.establishment.update({
          where: { id: establishmentId },
          data: {
            slug: input.slug,
            name: input.name?.trim(),
            description:
              input.description === undefined
                ? undefined
                : input.description?.trim() || null,
            address:
              input.address === undefined
                ? undefined
                : input.address?.trim() || null,
            timezone: input.timezone,
            currency: input.currency,
            locale: input.locale,
            minimumBookingNoticeMinutes: input.minimumBookingNoticeMinutes,
            maximumBookingDays: input.maximumBookingDays,
            cancellationNoticeHours: input.cancellationNoticeHours,
          },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            address: true,
            timezone: true,
            currency: true,
            locale: true,
            minimumBookingNoticeMinutes: true,
            maximumBookingDays: true,
            cancellationNoticeHours: true,
            status: true,
            updatedAt: true,
          },
        });
        await this.recordAudit(
          userId,
          establishmentId,
          'establishment.updated',
          'ESTABLISHMENT',
          establishmentId,
          { fields: Object.keys(input) },
          tx,
        );
        return establishment;
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'This establishment slug is already in use',
        );
      }
      if (this.isMissingRecordError(error)) {
        throw new NotFoundException('Establishment not found');
      }
      throw error;
    }
  }

  async listServices(userId: string, establishmentId: string) {
    await this.authorize(userId, establishmentId, 'services.read');
    return this.prisma.service.findMany({
      where: { establishmentId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createService(
    userId: string,
    establishmentId: string,
    input: CreateServiceDto,
  ) {
    await this.authorize(userId, establishmentId, 'services.write');
    const establishment = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          establishmentId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          durationMinutes: input.durationMinutes,
          price: input.price ?? null,
          isActive: input.isActive ?? true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          isActive: true,
          createdAt: true,
        },
      });
      await this.recordAudit(
        userId,
        establishmentId,
        'service.created',
        'SERVICE',
        service.id,
        {},
        tx,
      );
      return service;
    });
  }

  async updateService(
    userId: string,
    establishmentId: string,
    serviceId: string,
    input: UpdateServiceDto,
  ) {
    await this.authorize(userId, establishmentId, 'services.write');
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.service.updateMany({
        where: { id: serviceId, establishmentId },
        data: {
          name: input.name?.trim(),
          description:
            input.description === undefined
              ? undefined
              : input.description?.trim() || null,
          durationMinutes: input.durationMinutes,
          price: input.price,
          isActive: input.isActive,
        },
      });
      if (result.count === 0) {
        throw new NotFoundException('Service not found');
      }

      const service = await tx.service.findFirstOrThrow({
        where: { id: serviceId, establishmentId },
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          isActive: true,
          updatedAt: true,
        },
      });
      await this.recordAudit(
        userId,
        establishmentId,
        'service.updated',
        'SERVICE',
        serviceId,
        { fields: Object.keys(input) },
        tx,
      );
      return service;
    });
  }

  async deactivateService(
    userId: string,
    establishmentId: string,
    serviceId: string,
  ) {
    await this.authorize(userId, establishmentId, 'services.write');
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.service.updateMany({
        where: { id: serviceId, establishmentId, isActive: true },
        data: { isActive: false },
      });
      if (result.count === 0) {
        throw new NotFoundException('Active service not found');
      }
      await this.recordAudit(
        userId,
        establishmentId,
        'service.deactivated',
        'SERVICE',
        serviceId,
        {},
        tx,
      );
      return { id: serviceId, isActive: false };
    });
  }

  async listEmployees(userId: string, establishmentId: string) {
    await this.authorize(userId, establishmentId, 'employees.read');
    return this.prisma.employee.findMany({
      where: { establishmentId },
      orderBy: { displayName: 'asc' },
      select: {
        id: true,
        memberId: true,
        displayName: true,
        isActive: true,
        services: { select: { serviceId: true } },
        createdAt: true,
      },
    });
  }

  private async authorizeCustomerRead(userId: string, establishmentId: string) {
    const membership = await this.prisma.establishmentMember.findFirst({
      where: {
        establishmentId,
        userId,
        status: 'ACTIVE',
        establishment: { status: 'ACTIVE' },
      },
      select: {
        role: true,
        permissions: true,
        employee: { select: { id: true } },
      },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this establishment',
      );
    }
    this.assertPermission(membership, 'customers.read');
    if (membership.role === 'EMPLOYEE' && !membership.employee) {
      throw new ForbiddenException(
        'The employee account is not linked to an employee profile',
      );
    }
    return membership;
  }

  async listCustomers(
    userId: string,
    establishmentId: string,
    filters: { q?: string; cursor?: string; limit?: number },
  ) {
    const membership = await this.authorizeCustomerRead(
      userId,
      establishmentId,
    );
    const limit = filters.limit ?? 50;
    const search = filters.q?.trim();
    const where: Prisma.CustomerWhereInput = {
      establishmentId,
      ...(membership.role === 'EMPLOYEE'
        ? { bookings: { some: { employeeId: membership.employee!.id } } }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phoneNormalized: { contains: search } },
            ],
          }
        : {}),
    };

    if (filters.cursor) {
      const cursorCustomer = await this.prisma.customer.findFirst({
        where: {
          id: filters.cursor,
          establishmentId,
          ...(membership.role === 'EMPLOYEE'
            ? { bookings: { some: { employeeId: membership.employee!.id } } }
            : {}),
        },
        select: { id: true },
      });
      if (!cursorCustomer) {
        throw new BadRequestException('Customer cursor is not valid');
      }
    }

    const items = await this.prisma.customer.findMany({
      where,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      take: limit + 1,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        phoneNormalized: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getCustomer(
    userId: string,
    establishmentId: string,
    customerId: string,
  ) {
    const membership = await this.authorizeCustomerRead(
      userId,
      establishmentId,
    );
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        establishmentId,
        ...(membership.role === 'EMPLOYEE'
          ? { bookings: { some: { employeeId: membership.employee!.id } } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        phoneNormalized: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async listCustomerBookings(
    userId: string,
    establishmentId: string,
    customerId: string,
    filters: { cursor?: string; limit?: number },
  ) {
    const membership = await this.authorizeCustomerRead(
      userId,
      establishmentId,
    );
    const employeeId =
      membership.role === 'EMPLOYEE' ? membership.employee!.id : undefined;
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        establishmentId,
        ...(employeeId ? { bookings: { some: { employeeId } } } : {}),
      },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    if (filters.cursor) {
      const cursorBooking = await this.prisma.booking.findFirst({
        where: {
          id: filters.cursor,
          establishmentId,
          customerId,
          ...(employeeId ? { employeeId } : {}),
        },
        select: { id: true },
      });
      if (!cursorBooking) {
        throw new BadRequestException('Booking cursor is not valid');
      }
    }

    const limit = filters.limit ?? 50;
    const items = await this.prisma.booking.findMany({
      where: {
        establishmentId,
        customerId,
        ...(employeeId ? { employeeId } : {}),
      },
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      take: limit + 1,
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        publicReference: true,
        status: true,
        startsAt: true,
        endsAt: true,
        serviceNameSnapshot: true,
        durationMinutesSnapshot: true,
        employee: { select: { id: true, displayName: true } },
      },
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async inviteEmployee(
    userId: string,
    establishmentId: string,
    input: CreateEmployeeInvitationDto,
  ) {
    await this.authorize(userId, establishmentId, 'employees.write');
    const email = input.email.trim().toLowerCase();
    const invitationToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256')
      .update(invitationToken, 'utf8')
      .digest();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const activeMembership = await tx.establishmentMember.findFirst({
        where: {
          establishmentId,
          status: 'ACTIVE',
          user: { email },
        },
        select: { id: true },
      });
      if (activeMembership) {
        throw new ConflictException(
          'This user is already an active member of the establishment',
        );
      }

      await this.assertServicesBelongToEstablishment(
        establishmentId,
        input.serviceIds ?? [],
        tx,
      );
      await tx.employeeInvitation.updateMany({
        where: {
          establishmentId,
          email,
          acceptedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
      const invitation = await tx.employeeInvitation.create({
        data: {
          id: randomUUID(),
          establishmentId,
          invitedByUserId: userId,
          email,
          displayName: input.displayName.trim(),
          serviceIds: input.serviceIds ?? [],
          tokenHash,
          expiresAt,
        },
        select: { id: true, expiresAt: true },
      });
      await this.recordAudit(
        userId,
        establishmentId,
        'employee.invitation_created',
        'EMPLOYEE_INVITATION',
        invitation.id,
        { email },
        tx,
      );
      return {
        id: invitation.id,
        email,
        expiresAt: invitation.expiresAt,
        invitationToken,
      };
    });
  }

  async listEmployeeInvitations(userId: string, establishmentId: string) {
    await this.authorize(userId, establishmentId, 'employees.read');
    return this.prisma.employeeInvitation.findMany({
      where: {
        establishmentId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        serviceIds: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revokeEmployeeInvitation(
    userId: string,
    establishmentId: string,
    invitationId: string,
  ) {
    await this.authorize(userId, establishmentId, 'employees.write');
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.employeeInvitation.updateMany({
        where: {
          id: invitationId,
          establishmentId,
          acceptedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
      if (result.count === 0) {
        throw new NotFoundException('Pending employee invitation not found');
      }
      await this.recordAudit(
        userId,
        establishmentId,
        'employee.invitation_revoked',
        'EMPLOYEE_INVITATION',
        invitationId,
        {},
        tx,
      );
      return { id: invitationId, revoked: true };
    });
  }

  async createEmployee(
    userId: string,
    establishmentId: string,
    input: CreateEmployeeDto,
  ) {
    await this.authorize(userId, establishmentId, 'employees.write');

    try {
      const employee = await this.prisma.$transaction(async (tx) => {
        const membership = await tx.establishmentMember.findFirst({
          where: {
            id: input.memberId,
            establishmentId,
            status: 'ACTIVE',
            role: 'EMPLOYEE',
          },
          select: { id: true },
        });
        if (!membership) {
          throw new BadRequestException(
            'memberId must belong to an active employee membership in this establishment',
          );
        }
        // Enforce the plan's employee seat quota server-side.
        await this.subscriptions.assertWithinEmployeeQuota(establishmentId, tx);
        await this.assertServicesBelongToEstablishment(
          establishmentId,
          input.serviceIds ?? [],
          tx,
        );
        const created = await tx.employee.create({
          data: {
            establishmentId,
            memberId: membership.id,
            displayName: input.displayName.trim(),
            isActive: input.isActive ?? true,
          },
          select: {
            id: true,
            memberId: true,
            displayName: true,
            isActive: true,
            createdAt: true,
          },
        });
        if (input.serviceIds?.length) {
          await tx.employeeService.createMany({
            data: input.serviceIds.map((serviceId) => ({
              employeeId: created.id,
              serviceId,
            })),
          });
        }
        await tx.auditLog.create({
          data: {
            actorUserId: userId,
            establishmentId,
            action: 'employee.created',
            targetType: 'EMPLOYEE',
            targetId: created.id,
            metadata: { serviceCount: input.serviceIds?.length ?? 0 },
          },
        });
        return created;
      });
      return {
        ...employee,
        services: (input.serviceIds ?? []).map((serviceId) => ({ serviceId })),
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'This membership is already linked to an employee profile',
        );
      }
      throw error;
    }
  }

  async updateEmployee(
    userId: string,
    establishmentId: string,
    employeeId: string,
    input: UpdateEmployeeDto,
  ) {
    await this.authorize(userId, establishmentId, 'employees.write');
    const employee = await this.prisma.$transaction(async (tx) => {
      const current = await tx.employee.findFirst({
        where: { id: employeeId, establishmentId },
        select: { id: true },
      });
      if (!current) {
        throw new NotFoundException('Employee not found');
      }
      if (input.serviceIds !== undefined) {
        await this.assertServicesBelongToEstablishment(
          establishmentId,
          input.serviceIds,
          tx,
        );
      }

      await tx.employee.update({
        where: { id: employeeId },
        data: {
          displayName: input.displayName?.trim(),
          isActive: input.isActive,
        },
      });
      if (input.serviceIds !== undefined) {
        await tx.employeeService.deleteMany({ where: { employeeId } });
        if (input.serviceIds.length) {
          await tx.employeeService.createMany({
            data: input.serviceIds.map((serviceId) => ({
              employeeId,
              serviceId,
            })),
          });
        }
      }
      const updated = await tx.employee.findFirstOrThrow({
        where: { id: employeeId, establishmentId },
        select: {
          id: true,
          memberId: true,
          displayName: true,
          isActive: true,
          services: { select: { serviceId: true } },
          createdAt: true,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          establishmentId,
          action: 'employee.updated',
          targetType: 'EMPLOYEE',
          targetId: employeeId,
          metadata: { fields: Object.keys(input) },
        },
      });
      return updated;
    });

    return employee;
  }

  private async assertServicesBelongToEstablishment(
    establishmentId: string,
    serviceIds: string[],
    database: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    if (!serviceIds.length) {
      return;
    }
    const count = await database.service.count({
      where: {
        establishmentId,
        id: { in: serviceIds },
        isActive: true,
      },
    });
    if (count !== serviceIds.length) {
      throw new BadRequestException(
        'Every serviceId must identify an active service in this establishment',
      );
    }
  }
}
