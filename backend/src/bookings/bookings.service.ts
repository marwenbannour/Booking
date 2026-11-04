import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { NotificationsSchedulingService } from '../notifications/notifications-scheduling.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

class SlotUnavailableException extends ConflictException {
  constructor(message = 'The selected slot is no longer available') {
    super({
      statusCode: 409,
      code: 'SLOT_UNAVAILABLE',
      message,
    });
  }
}

class IdempotencyKeyConflictException extends ConflictException {
  constructor(
    message = 'The idempotency key was reused with a different payload',
  ) {
    super({
      statusCode: 409,
      code: 'IDEMPOTENCY_KEY_REUSED',
      message,
    });
  }
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: NotificationsSchedulingService,
    private readonly subscriptions: SubscriptionsService,
    @Optional() private readonly config?: ConfigService,
  ) {}

  private getBookingTokenEncryptionKey(): Buffer {
    const secret = this.config?.get<string>('JWT_ACCESS_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_ACCESS_SECRET must contain at least 32 characters to protect booking access tokens',
      );
    }

    return createHash('sha256')
      .update(`booking-access-token:${secret}`, 'utf8')
      .digest();
  }

  private encryptBookingAccessToken(token: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      'aes-256-gcm',
      this.getBookingTokenEncryptionKey(),
      iv,
    );
    const ciphertext = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
    ]);

    return [
      'v1',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      ciphertext.toString('base64url'),
    ].join('.');
  }

  private decryptBookingAccessToken(encryptedToken: string): string {
    const [version, ivValue, tagValue, ciphertextValue] =
      encryptedToken.split('.');
    if (
      !version ||
      version !== 'v1' ||
      !ivValue ||
      !tagValue ||
      !ciphertextValue
    ) {
      throw new Error('Stored booking access token has an invalid format');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getBookingTokenEncryptionKey(),
      Buffer.from(ivValue, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private async createBookingAccessToken(
    tx: Prisma.TransactionClient,
    establishmentId: string,
    bookingId: string,
  ): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await tx.bookingAccessToken.create({
      data: {
        establishmentId,
        bookingId,
        tokenHash: createHash('sha256').update(token, 'utf8').digest(),
        scopes: ['booking:reschedule'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return token;
  }

  private getDateParts(date: string): {
    year: number;
    month: number;
    day: number;
  } {
    const [year, month, day] = date.split('-').map(Number);
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day)
    ) {
      throw new BadRequestException('Date must use YYYY-MM-DD format');
    }

    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      throw new BadRequestException('Date must be a valid calendar date');
    }

    return { year, month, day };
  }

  private getTimezoneOffsetMinutes(targetDate: Date, timeZone: string): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const timeZoneName = formatter
      .formatToParts(targetDate)
      .find((part) => part.type === 'timeZoneName')?.value;
    if (!timeZoneName) {
      throw new BadRequestException(
        'Unable to resolve the establishment timezone',
      );
    }
    const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!match) {
      if (timeZoneName === 'GMT') {
        return 0;
      }
      throw new BadRequestException(
        'Unable to resolve the establishment timezone offset',
      );
    }

    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2] ?? 0);
    const minutes = Number(match[3] ?? 0);

    return sign * (hours * 60 + minutes);
  }

  private dateAtTimeInTimeZone(
    date: string,
    time: string,
    timeZone: string,
  ): Date {
    const { year, month, day } = this.getDateParts(date);
    const timeMatch = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!timeMatch) {
      throw new BadRequestException(
        'Business hours must use a valid local time',
      );
    }

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] ?? 0);
    if (hours > 23 || minutes > 59 || seconds > 59) {
      throw new BadRequestException(
        'Business hours must use a valid local time',
      );
    }

    const localAsUtc = Date.UTC(year, month - 1, day, hours, minutes, seconds);
    let utcMs = localAsUtc;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const offsetMinutes = this.getTimezoneOffsetMinutes(
        new Date(utcMs),
        timeZone,
      );
      const adjustedUtcMs = localAsUtc - offsetMinutes * 60_000;
      if (adjustedUtcMs === utcMs) {
        break;
      }
      utcMs = adjustedUtcMs;
    }

    return new Date(utcMs);
  }

  private getLocalDate(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
  }

  private getNextDate(date: string): string {
    const { year, month, day } = this.getDateParts(date);
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

    return `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}-${String(
      nextDate.getUTCDate(),
    ).padStart(2, '0')}`;
  }

  private isSlotConflict(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as {
      code?: unknown;
      meta?: {
        code?: unknown;
        constraint?: unknown;
        database_error?: unknown;
        driverAdapterError?: unknown;
      };
      cause?: unknown;
    };
    const databaseError = candidate.meta?.database_error;
    if (
      candidate.code === '23P01' ||
      candidate.meta?.code === '23P01' ||
      (candidate.code === 'P2004' &&
        (candidate.meta?.constraint === 'bookings_employee_active_no_overlap' ||
          (typeof databaseError === 'string' &&
            databaseError.includes('bookings_employee_active_no_overlap'))))
    ) {
      return true;
    }

    return (
      this.isSlotConflict(candidate.cause) ||
      this.isSlotConflict(candidate.meta?.driverAdapterError)
    );
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
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as { code?: unknown; cause?: unknown };
    return (
      candidate.code === 'P2025' || this.isMissingRecordError(candidate.cause)
    );
  }

  private getDayOfWeek(date: string): number {
    const { year, month, day } = this.getDateParts(date);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  private getBusinessHourWindows(
    date: string,
    timeZone: string,
    businessHours: Array<{ opensAt: Date; closesAt: Date }>,
    useDefaultHours: boolean,
  ) {
    const windows: Array<{ start: Date; end: Date }> = [];
    if (!businessHours.length && useDefaultHours) {
      const defaultOpen = this.dateAtTimeInTimeZone(date, '09:00', timeZone);
      const defaultClose = this.dateAtTimeInTimeZone(date, '18:00', timeZone);
      windows.push({ start: defaultOpen, end: defaultClose });
      return windows;
    }

    for (const businessHour of businessHours) {
      const openAt = this.dateAtTimeInTimeZone(
        date,
        this.formatTimeOfDay(businessHour.opensAt),
        timeZone,
      );
      const closeAt = this.dateAtTimeInTimeZone(
        date,
        this.formatTimeOfDay(businessHour.closesAt),
        timeZone,
      );
      if (closeAt > openAt) {
        windows.push({ start: openAt, end: closeAt });
      }
    }

    return windows;
  }

  private formatTimeOfDay(value: Date): string {
    return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
  }

  private hashRequest(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private async assertEstablishmentMember(
    userId: string | undefined,
    establishmentId: string,
  ) {
    if (!userId) {
      throw new ForbiddenException(
        'An authenticated establishment member is required',
      );
    }

    const membership = await this.prisma.establishmentMember.findFirst({
      where: {
        establishmentId,
        userId,
        status: 'ACTIVE',
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

    return membership;
  }

  private assertPermission(
    membership: { role: string; permissions: unknown },
    permission: 'bookings.read' | 'bookings.write',
  ) {
    const permissions =
      membership.permissions &&
      typeof membership.permissions === 'object' &&
      !Array.isArray(membership.permissions)
        ? (membership.permissions as Record<string, unknown>)
        : {};
    const aliases =
      permission === 'bookings.read'
        ? ['bookings.read', 'bookings:read']
        : ['bookings.write', 'bookings:write'];
    const configured = aliases
      .filter((key) => Object.hasOwn(permissions, key))
      .map((key) => permissions[key])[0];
    const roleAllows = ['OWNER', 'MANAGER', 'EMPLOYEE'].includes(
      membership.role,
    );

    if (configured === false || (configured !== true && !roleAllows)) {
      throw new ForbiddenException(
        `You do not have permission to ${permission.replace('.', ' ')}`,
      );
    }
  }

  private isTimeSlotAvailable(
    slotStart: Date,
    slotEnd: Date,
    relevantBookings: Array<{
      employeeId: string;
      startsAt: Date;
      endsAt: Date;
    }>,
    relevantTimeOffs: Array<{
      employeeId: string;
      startsAt: Date;
      endsAt: Date;
    }>,
    employeeId: string,
    minBookingTime: Date,
    maxBookingTime: Date,
  ) {
    if (slotStart < minBookingTime || slotStart > maxBookingTime) {
      return false;
    }

    const hasBookingOverlap = relevantBookings.some(
      (booking) =>
        booking.employeeId === employeeId &&
        slotStart < booking.endsAt &&
        slotEnd > booking.startsAt,
    );

    if (hasBookingOverlap) {
      return false;
    }

    const hasTimeOffOverlap = relevantTimeOffs.some(
      (timeOff) =>
        timeOff.employeeId === employeeId &&
        slotStart < timeOff.endsAt &&
        slotEnd > timeOff.startsAt,
    );

    return !hasTimeOffOverlap;
  }

  async listBookings(
    userId: string,
    establishmentId: string,
    filters: {
      status?:
        | 'PENDING'
        | 'CONFIRMED'
        | 'COMPLETED'
        | 'CANCELLED'
        | 'NO_SHOW'
        | 'REJECTED';
      employeeId?: string;
      serviceId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const membership = await this.assertEstablishmentMember(
      userId,
      establishmentId,
    );
    this.assertPermission(membership, 'bookings.read');

    if (
      filters.dateFrom &&
      filters.dateTo &&
      filters.dateFrom > filters.dateTo
    ) {
      throw new BadRequestException(
        'The start of the date range must be before its end',
      );
    }

    const where: Prisma.BookingWhereInput = { establishmentId };
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
    const offset = Math.max(filters.offset ?? 0, 0);

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.employeeId) {
      if (
        membership.role === 'EMPLOYEE' &&
        membership.employee?.id !== filters.employeeId
      ) {
        throw new ForbiddenException(
          'Employees may only view their own bookings',
        );
      }
      where.employeeId = filters.employeeId;
    }
    if (membership.role === 'EMPLOYEE') {
      if (!membership.employee) {
        throw new ForbiddenException(
          'The employee account is not linked to an employee profile',
        );
      }
      where.employeeId = membership.employee.id;
    }
    if (filters.serviceId) {
      where.serviceId = filters.serviceId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.startsAt = {};
      if (filters.dateFrom) {
        where.startsAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.startsAt.lte = filters.dateTo;
      }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          publicReference: true,
          status: true,
          source: true,
          startsAt: true,
          endsAt: true,
          customerNameSnapshot: true,
          customerPhoneSnapshot: true,
          customerEmailSnapshot: true,
          cancellationReason: true,
          createdAt: true,
          updatedAt: true,
          employee: {
            select: {
              id: true,
              displayName: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phoneNormalized: true,
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      total,
      limit,
      offset,
      items,
    };
  }

  async getBookingDetails(
    userId: string,
    establishmentId: string,
    bookingId: string,
  ) {
    const membership = await this.assertEstablishmentMember(
      userId,
      establishmentId,
    );
    this.assertPermission(membership, 'bookings.read');

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, establishmentId },
      select: {
        id: true,
        publicReference: true,
        status: true,
        source: true,
        startsAt: true,
        endsAt: true,
        customerNameSnapshot: true,
        customerPhoneSnapshot: true,
        customerEmailSnapshot: true,
        serviceNameSnapshot: true,
        durationMinutesSnapshot: true,
        priceSnapshot: true,
        currency: true,
        cancellationReason: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        employee: { select: { id: true, displayName: true } },
        service: { select: { id: true, name: true } },
        customer: {
          select: { id: true, name: true, phoneNormalized: true, email: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (
      membership.role === 'EMPLOYEE' &&
      membership.employee?.id !== booking.employee.id
    ) {
      throw new ForbiddenException(
        'Employees may only view their own bookings',
      );
    }

    const events = await this.prisma.$queryRaw<
      Array<{
        id: string;
        eventType: string;
        actorUserId: string | null;
        data: unknown;
        createdAt: Date;
      }>
    >`
      SELECT id, event_type AS "eventType", actor_user_id AS "actorUserId", data, created_at AS "createdAt"
      FROM booking_events
      WHERE establishment_id = ${establishmentId} AND booking_id = ${bookingId}
      ORDER BY created_at ASC
    `;

    return { ...booking, events };
  }

  async createPublicRescheduleRequest(
    bookingId: string,
    accessToken: string,
    requestedStartsAt: Date,
    requestedEmployeeId: string,
  ) {
    if (Number.isNaN(requestedStartsAt.getTime())) {
      throw new BadRequestException(
        'requestedStartsAt must be a valid ISO datetime',
      );
    }
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(accessToken)) {
      throw new UnauthorizedException(
        'Booking access token is invalid or expired',
      );
    }

    return this.prisma
      .$transaction(async (tx) => {
        const tokenHash = createHash('sha256')
          .update(accessToken, 'utf8')
          .digest();
        const access = await tx.bookingAccessToken.findFirst({
          where: {
            bookingId,
            tokenHash,
            revokedAt: null,
            expiresAt: { gt: new Date() },
            scopes: { has: 'booking:reschedule' },
          },
          select: { establishmentId: true },
        });
        if (!access) {
          throw new UnauthorizedException(
            'Booking access token is invalid or expired',
          );
        }

        const booking = await tx.booking.findFirst({
          where: {
            id: bookingId,
            establishmentId: access.establishmentId,
          },
          select: {
            id: true,
            status: true,
            startsAt: true,
            employeeId: true,
            serviceId: true,
            durationMinutesSnapshot: true,
          },
        });
        if (!booking) {
          throw new NotFoundException('Booking not found');
        }
        if (booking.status !== 'CONFIRMED' || booking.startsAt <= new Date()) {
          throw new ConflictException(
            'Only future confirmed bookings can be rescheduled',
          );
        }

        const pendingRequest = await tx.bookingRescheduleRequest.findFirst({
          where: {
            establishmentId: access.establishmentId,
            bookingId,
            status: 'PENDING',
          },
          select: { id: true },
        });
        if (pendingRequest) {
          throw new ConflictException(
            'A reschedule request is already awaiting a decision',
          );
        }

        const localDate = this.getLocalDate(
          requestedStartsAt,
          (
            await tx.establishment.findUniqueOrThrow({
              where: { id: access.establishmentId },
              select: { timezone: true },
            })
          ).timezone,
        );
        const availability = await this.getAvailability(
          booking.serviceId,
          localDate,
          requestedEmployeeId,
          access.establishmentId,
          tx,
          booking.durationMinutesSnapshot,
        );
        if (
          !availability.slots.some(
            (slot) =>
              slot.employeeId === requestedEmployeeId &&
              new Date(slot.start).getTime() === requestedStartsAt.getTime(),
          )
        ) {
          throw new SlotUnavailableException();
        }

        const request = await tx.bookingRescheduleRequest.create({
          data: {
            establishmentId: access.establishmentId,
            bookingId,
            originalStartsAt: booking.startsAt,
            originalEmployeeId: booking.employeeId,
            requestedStartsAt,
            requestedEmployeeId,
          },
          select: {
            id: true,
            status: true,
            originalStartsAt: true,
            requestedStartsAt: true,
            createdAt: true,
          },
        });
        await tx.bookingEvent.create({
          data: {
            establishmentId: access.establishmentId,
            bookingId,
            eventType: 'RESCHEDULE_REQUESTED',
            data: {
              rescheduleRequestId: request.id,
              originalStartsAt: booking.startsAt.toISOString(),
              requestedStartsAt: requestedStartsAt.toISOString(),
              requestedEmployeeId,
            },
          },
        });

        return request;
      })
      .catch((error: unknown) => {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException(
            'A reschedule request is already awaiting a decision',
          );
        }
        throw error;
      });
  }

  async listRescheduleRequests(userId: string, establishmentId: string) {
    const membership = await this.assertEstablishmentMember(
      userId,
      establishmentId,
    );
    this.assertPermission(membership, 'bookings.read');

    return this.prisma.bookingRescheduleRequest.findMany({
      where: {
        establishmentId,
        status: 'PENDING',
        ...(membership.role === 'EMPLOYEE' && membership.employee?.id
          ? { booking: { employeeId: membership.employee.id } }
          : {}),
      },
      take: 100,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        bookingId: true,
        originalStartsAt: true,
        requestedStartsAt: true,
        requestedEmployeeId: true,
        createdAt: true,
        requestedEmployee: { select: { displayName: true } },
        booking: {
          select: {
            publicReference: true,
            status: true,
            customerNameSnapshot: true,
            serviceNameSnapshot: true,
            employee: { select: { displayName: true } },
          },
        },
      },
    });
  }

  async decideRescheduleRequest(
    userId: string,
    establishmentId: string,
    bookingId: string,
    requestId: string,
    decision: 'ACCEPTED' | 'REJECTED',
    reason?: string,
  ) {
    const membership = await this.assertEstablishmentMember(
      userId,
      establishmentId,
    );
    this.assertPermission(membership, 'bookings.write');
    if (decision === 'REJECTED' && !reason?.trim()) {
      throw new BadRequestException('A reason is required to reject a request');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.bookingRescheduleRequest.findFirst({
        where: {
          id: requestId,
          bookingId,
          establishmentId,
          status: 'PENDING',
        },
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              startsAt: true,
              endsAt: true,
              employeeId: true,
              serviceId: true,
              durationMinutesSnapshot: true,
              version: true,
              remindersConsent: true,
            },
          },
        },
      });
      if (!request) {
        throw new NotFoundException('Pending reschedule request not found');
      }
      if (
        request.booking.status !== 'CONFIRMED' ||
        request.booking.startsAt.getTime() !==
          request.originalStartsAt.getTime() ||
        request.booking.employeeId !== request.originalEmployeeId
      ) {
        throw new ConflictException(
          'The booking changed after this reschedule request was submitted',
        );
      }

      const decidedAt = new Date();
      if (decision === 'REJECTED') {
        const updatedRequest = await tx.bookingRescheduleRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            decisionReason: reason!.trim(),
            decidedByUserId: userId,
            decidedAt,
          },
        });
        await tx.bookingEvent.create({
          data: {
            establishmentId,
            bookingId: request.bookingId,
            eventType: 'RESCHEDULE_REJECTED',
            actorUserId: userId,
            data: {
              rescheduleRequestId: requestId,
              reason: reason!.trim(),
              requestedStartsAt: request.requestedStartsAt.toISOString(),
            },
          },
        });
        await tx.auditLog.create({
          data: {
            establishmentId,
            actorUserId: userId,
            action: 'booking.reschedule_rejected',
            targetType: 'BOOKING',
            targetId: request.bookingId,
            metadata: { rescheduleRequestId: requestId },
          },
        });
        return updatedRequest;
      }

      const timezone = await tx.establishment.findUniqueOrThrow({
        where: { id: establishmentId },
        select: { timezone: true },
      });
      const localDate = this.getLocalDate(
        request.requestedStartsAt,
        timezone.timezone,
      );
      const availability = await this.getAvailability(
        request.booking.serviceId,
        localDate,
        request.requestedEmployeeId,
        establishmentId,
        tx,
        request.booking.durationMinutesSnapshot,
      );
      if (
        !availability.slots.some(
          (slot) =>
            slot.employeeId === request.requestedEmployeeId &&
            new Date(slot.start).getTime() ===
              request.requestedStartsAt.getTime(),
        )
      ) {
        throw new SlotUnavailableException();
      }

      const employeeLock = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM employees
        WHERE id = ${request.requestedEmployeeId}::uuid
          AND establishment_id = ${establishmentId}::uuid
        FOR UPDATE
      `;
      if (!employeeLock.length) {
        throw new SlotUnavailableException();
      }
      const endsAt = new Date(
        request.requestedStartsAt.getTime() +
          request.booking.durationMinutesSnapshot * 60_000,
      );
      const conflict = await tx.booking.findFirst({
        where: {
          establishmentId,
          employeeId: request.requestedEmployeeId,
          id: { not: request.bookingId },
          status: { in: ['PENDING', 'CONFIRMED'] },
          startsAt: { lt: endsAt },
          endsAt: { gt: request.requestedStartsAt },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new SlotUnavailableException();
      }

      const updatedBooking = await tx.booking.update({
        where: {
          id: request.bookingId,
          version: request.booking.version,
          status: 'CONFIRMED',
        },
        data: {
          startsAt: request.requestedStartsAt,
          endsAt,
          employeeId: request.requestedEmployeeId,
          version: { increment: 1 },
        },
        select: { version: true },
      });
      const updatedRequest = await tx.bookingRescheduleRequest.update({
        where: { id: requestId },
        data: {
          status: 'ACCEPTED',
          decisionReason: reason?.trim() || null,
          decidedByUserId: userId,
          decidedAt,
        },
      });
      await tx.bookingEvent.create({
        data: {
          establishmentId,
          bookingId: request.bookingId,
          eventType: 'RESCHEDULED',
          actorUserId: userId,
          data: {
            rescheduleRequestId: requestId,
            previousStartsAt: request.booking.startsAt.toISOString(),
            startsAt: request.requestedStartsAt.toISOString(),
            previousEmployeeId: request.booking.employeeId,
            employeeId: request.requestedEmployeeId,
            version: updatedBooking.version,
          },
        },
      });
      await tx.auditLog.create({
        data: {
          establishmentId,
          actorUserId: userId,
          action: 'booking.rescheduled',
          targetType: 'BOOKING',
          targetId: request.bookingId,
          metadata: {
            rescheduleRequestId: requestId,
            previousStartsAt: request.booking.startsAt.toISOString(),
            startsAt: request.requestedStartsAt.toISOString(),
          },
        },
      });
      await this.scheduler.scheduleForRescheduledBooking(tx, {
        id: request.bookingId,
        establishmentId,
        startsAt: request.requestedStartsAt,
        remindersConsent: request.booking.remindersConsent,
        version: updatedBooking.version,
      });

      return updatedRequest;
    }).catch((error: unknown) => {
      if (this.isSlotConflict(error)) {
        throw new SlotUnavailableException();
      }
      if (this.isMissingRecordError(error)) {
        throw new ConflictException(
          'The booking or reschedule request changed before the decision was saved',
        );
      }
      throw error;
    });
  }

  async getAvailability(
    serviceId: string,
    date: string,
    employeeId?: string,
    establishmentId?: string,
    database: Prisma.TransactionClient = this.prisma,
    durationMinutesOverride?: number,
  ) {
    const service = await database.service.findFirst({
      where: {
        id: serviceId,
        isActive: true,
        ...(establishmentId ? { establishmentId } : {}),
      },
      select: {
        id: true,
        durationMinutes: true,
        establishmentId: true,
        establishment: {
          select: {
            timezone: true,
            minimumBookingNoticeMinutes: true,
            maximumBookingDays: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }
    const durationMinutes = durationMinutesOverride ?? service.durationMinutes;

    this.getDateParts(date);
    const dayStart = this.dateAtTimeInTimeZone(
      date,
      '00:00',
      service.establishment.timezone,
    );
    const dayEnd = this.dateAtTimeInTimeZone(
      this.getNextDate(date),
      '00:00',
      service.establishment.timezone,
    );
    const now = new Date();
    const minBookingTime = new Date(
      now.getTime() +
        service.establishment.minimumBookingNoticeMinutes * 60_000,
    );
    const maxAllowedDate = new Date(
      now.getTime() +
        service.establishment.maximumBookingDays * 24 * 60 * 60 * 1000,
    );

    if (dayEnd <= now || dayStart > maxAllowedDate) {
      return {
        date,
        timezone: service.establishment.timezone,
        serviceId,
        durationMinutes,
        slots: [],
      };
    }

    const [employees, bookings] = await Promise.all([
      database.employee.findMany({
        where: {
          establishmentId: service.establishmentId,
          isActive: true,
          ...(employeeId ? { id: employeeId } : {}),
        },
        orderBy: { displayName: 'asc' },
        select: {
          id: true,
          displayName: true,
          services: { where: { serviceId }, select: { serviceId: true } },
        },
      }),
      database.booking.findMany({
        where: {
          establishmentId: service.establishmentId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: {
          employeeId: true,
          startsAt: true,
          endsAt: true,
        },
      }),
    ]);

    const relevantEmployeeIds = employees.map((employee) => employee.id);
    const businessHours = await database.businessHour.findMany({
      where: {
        establishmentId: service.establishmentId,
        OR: [
          { employeeId: null },
          ...(employeeId ? [{ employeeId }] : []),
          ...(relevantEmployeeIds.length
            ? [{ employeeId: { in: relevantEmployeeIds } }]
            : []),
        ],
      },
      select: {
        employeeId: true,
        dayOfWeek: true,
        opensAt: true,
        closesAt: true,
      },
    });
    const timeOffs = await database.timeOff.findMany({
      where: {
        establishmentId: service.establishmentId,
        employeeId: { in: relevantEmployeeIds },
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: {
        employeeId: true,
        startsAt: true,
        endsAt: true,
      },
    });

    const slots = [] as Array<{
      employeeId: string;
      start: string;
      end: string;
    }>;
    const slotMinutes = 30;
    const dayOfWeek = this.getDayOfWeek(date);

    for (const employee of employees) {
      if (!employee.services.length) continue;

      const employeeBookings = bookings.filter(
        (booking) => booking.employeeId === employee.id,
      );
      const employeeHours = businessHours.filter(
        (entry) => entry.employeeId === employee.id,
      );
      const establishmentHours = businessHours.filter(
        (entry) => entry.employeeId === null,
      );
      const hasEmployeeSchedule = employeeHours.length > 0;
      const configuredHours = hasEmployeeSchedule
        ? employeeHours
        : establishmentHours;
      const employeeBusinessHours = configuredHours.filter(
        (entry) => entry.dayOfWeek === dayOfWeek,
      );
      const employeeTimeOffs = timeOffs.filter(
        (entry) => entry.employeeId === employee.id,
      );
      const businessWindows = this.getBusinessHourWindows(
        date,
        service.establishment.timezone,
        employeeBusinessHours,
        !hasEmployeeSchedule && establishmentHours.length === 0,
      );

      for (const businessWindow of businessWindows) {
        for (
          let cursor = new Date(businessWindow.start);
          cursor < businessWindow.end;
          cursor = new Date(cursor.getTime() + slotMinutes * 60_000)
        ) {
          const slotStart = new Date(cursor);
          const slotEnd = new Date(
            slotStart.getTime() + durationMinutes * 60_000,
          );
          if (slotEnd > businessWindow.end) {
            continue;
          }

          if (
            this.isTimeSlotAvailable(
              slotStart,
              slotEnd,
              employeeBookings,
              employeeTimeOffs,
              employee.id,
              minBookingTime,
              maxAllowedDate,
            )
          ) {
            slots.push({
              employeeId: employee.id,
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
            });
          }
        }
      }
    }

    return {
      date,
      timezone: service.establishment.timezone,
      serviceId,
      durationMinutes,
      slots,
    };
  }

  private assertValidTransition(
    booking: {
      status: string;
      startsAt: Date;
      establishment?: { cancellationNoticeHours?: number } | null;
    },
    nextStatus:
      | 'PENDING'
      | 'CONFIRMED'
      | 'COMPLETED'
      | 'CANCELLED'
      | 'NO_SHOW'
      | 'REJECTED',
    reason?: string,
  ) {
    if (nextStatus === 'REJECTED' && (!reason || !reason.trim())) {
      throw new BadRequestException('Rejections require a reason');
    }

    if (nextStatus === 'CANCELLED' && (!reason || !reason.trim())) {
      throw new BadRequestException('Cancellations require a reason');
    }

    if (nextStatus === 'CANCELLED') {
      const noticeHours = booking.establishment?.cancellationNoticeHours ?? 24;
      const cancellationDeadline = new Date(
        booking.startsAt.getTime() - noticeHours * 60 * 60 * 1000,
      );
      if (new Date() >= cancellationDeadline) {
        throw new BadRequestException(
          `Bookings may only be cancelled before the ${noticeHours}-hour notice window`,
        );
      }
    }

    if (nextStatus === 'COMPLETED' && new Date() < booking.startsAt) {
      throw new BadRequestException(
        'Only bookings that have already started can be completed',
      );
    }

    if (nextStatus === 'NO_SHOW' && new Date() < booking.startsAt) {
      throw new BadRequestException(
        'No-show can only be marked after the scheduled start time',
      );
    }
  }

  async transitionBookingStatus(
    bookingId: string,
    nextStatus:
      | 'PENDING'
      | 'CONFIRMED'
      | 'COMPLETED'
      | 'CANCELLED'
      | 'NO_SHOW'
      | 'REJECTED',
    options: {
      establishmentId: string;
      reason?: string;
      actorUserId?: string;
      correlationId?: string;
    },
  ) {
    const allowedTransitions: Record<string, readonly string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED', 'REJECTED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
      REJECTED: [],
    };

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, establishmentId: options.establishmentId },
      select: {
        id: true,
        status: true,
        version: true,
        establishmentId: true,
        employeeId: true,
        startsAt: true,
        cancellationReason: true,
        establishment: {
          select: {
            cancellationNoticeHours: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const membership = await this.assertEstablishmentMember(
      options.actorUserId,
      options.establishmentId,
    );
    this.assertPermission(membership, 'bookings.write');
    if (
      membership.role === 'EMPLOYEE' &&
      membership.employee?.id !== booking.employeeId
    ) {
      throw new ForbiddenException(
        'Employees may only manage their own bookings',
      );
    }

    if (!allowedTransitions[booking.status]?.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid booking transition from ${booking.status} to ${nextStatus}`,
      );
    }

    this.assertValidTransition(booking, nextStatus, options.reason);

    return this.prisma.$transaction(async (tx) => {
      const latest = await tx.booking.findFirst({
        where: { id: bookingId, establishmentId: options.establishmentId },
        select: {
          id: true,
          status: true,
          version: true,
          establishmentId: true,
          startsAt: true,
          remindersConsent: true,
          cancellationReason: true,
          establishment: {
            select: {
              cancellationNoticeHours: true,
            },
          },
        },
      });

      if (!latest) {
        throw new NotFoundException('Booking not found');
      }

      if (latest.status !== booking.status) {
        throw new ConflictException(
          'Booking state changed before transition was applied',
        );
      }

      this.assertValidTransition(latest, nextStatus, options.reason);

      const nextCancellationReason =
        nextStatus === 'CANCELLED'
          ? (options.reason ?? 'Cancelled by customer')
          : null;
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: nextStatus,
          version: { increment: 1 },
          cancellationReason:
            nextCancellationReason ?? latest.cancellationReason,
        },
        select: {
          id: true,
          status: true,
          version: true,
          publicReference: true,
          customerNameSnapshot: true,
          customerPhoneSnapshot: true,
          serviceNameSnapshot: true,
          startsAt: true,
          endsAt: true,
          cancellationReason: true,
        },
      });

      await tx.$executeRaw`
        INSERT INTO booking_events (id, establishment_id, booking_id, event_type, actor_user_id, data, created_at)
        VALUES (
          gen_random_uuid(),
          ${latest.establishmentId},
          ${bookingId},
          ${nextStatus},
          ${options.actorUserId ?? null},
          ${JSON.stringify({
            previousStatus: booking.status,
            newStatus: nextStatus,
            reason: options.reason ?? null,
            correlationId: options.correlationId ?? null,
          })}::jsonb,
          NOW()
        )
      `;

      await tx.auditLog.create({
        data: {
          establishmentId: latest.establishmentId,
          actorUserId: options.actorUserId ?? null,
          action: `booking.${nextStatus.toLowerCase()}`,
          targetType: 'BOOKING',
          targetId: bookingId,
          correlationId: options.correlationId ?? null,
          metadata: {
            previousStatus: booking.status,
            newStatus: nextStatus,
            reason: options.reason ?? null,
          },
        },
      });

      // Schedule or cancel WhatsApp notifications as part of the same
      // transaction (transactional outbox); the relay dispatches after commit.
      await this.scheduler.scheduleStatusChange(tx, {
        booking: {
          id: bookingId,
          establishmentId: latest.establishmentId,
          startsAt: latest.startsAt,
          remindersConsent: latest.remindersConsent,
        },
        previousStatus: booking.status,
        newStatus: nextStatus,
      });

      if (
        ['CANCELLED', 'COMPLETED', 'NO_SHOW', 'REJECTED'].includes(nextStatus)
      ) {
        await tx.bookingRescheduleRequest.updateMany({
          where: { bookingId, status: 'PENDING' },
          data: {
            status: 'CANCELLED',
            decisionReason: `Booking transitioned to ${nextStatus}`,
            decidedAt: new Date(),
          },
        });
        await tx.bookingAccessToken.updateMany({
          where: { bookingId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return updated;
    });
  }

  async confirmBooking(
    bookingId: string,
    options: {
      establishmentId: string;
      actorUserId?: string;
      correlationId?: string;
    },
  ) {
    return this.transitionBookingStatus(bookingId, 'CONFIRMED', options);
  }

  async cancelBooking(
    bookingId: string,
    options: {
      establishmentId: string;
      reason?: string;
      actorUserId?: string;
      correlationId?: string;
    },
  ) {
    return this.transitionBookingStatus(bookingId, 'CANCELLED', options);
  }

  async rejectBooking(
    bookingId: string,
    options: {
      establishmentId: string;
      reason?: string;
      actorUserId?: string;
      correlationId?: string;
    },
  ) {
    return this.transitionBookingStatus(bookingId, 'REJECTED', options);
  }

  async completeBooking(
    bookingId: string,
    options: {
      establishmentId: string;
      actorUserId?: string;
      correlationId?: string;
    },
  ) {
    return this.transitionBookingStatus(bookingId, 'COMPLETED', options);
  }

  async markNoShow(
    bookingId: string,
    options: {
      establishmentId: string;
      actorUserId?: string;
      correlationId?: string;
    },
  ) {
    return this.transitionBookingStatus(bookingId, 'NO_SHOW', options);
  }

  async createPublicBooking(payload: {
    establishmentSlug: string;
    serviceId: string;
    employeeId?: string;
    startsAt: Date;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    consentToReminders: boolean;
    locale?: 'fr' | 'ar';
    idempotencyKey?: string;
  }) {
    const establishment = await this.prisma.establishment.findFirst({
      where: { slug: payload.establishmentSlug, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }

    if (
      !payload.customerName?.trim() ||
      payload.customerName.trim().length < 2
    ) {
      throw new BadRequestException(
        'customerName must contain at least 2 characters',
      );
    }

    if (
      !payload.customerPhone?.trim() ||
      payload.customerPhone.trim().length < 6
    ) {
      throw new BadRequestException('customerPhone is required');
    }

    const startsAt = new Date(payload.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('startsAt must be a valid ISO datetime');
    }

    if (
      payload.idempotencyKey &&
      (payload.idempotencyKey.length < 1 || payload.idempotencyKey.length > 200)
    ) {
      throw new BadRequestException(
        'Idempotency-Key must contain between 1 and 200 characters',
      );
    }

    const normalizedPhone = payload.customerPhone.trim();
    const requestHash = this.hashRequest({
      establishmentId: establishment.id,
      serviceId: payload.serviceId,
      employeeId: payload.employeeId ?? null,
      startsAt: startsAt.toISOString(),
      customerName: payload.customerName.trim(),
      customerPhone: normalizedPhone,
      customerEmail: payload.customerEmail?.trim() || null,
      consentToReminders: Boolean(payload.consentToReminders),
      ...(payload.locale ? { locale: payload.locale } : {}),
    });

    const scope = `public-bookings:${establishment.id}`;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const currentEstablishment = await tx.establishment.findFirst({
          where: { id: establishment.id, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            locale: true,
            timezone: true,
            currency: true,
            minimumBookingNoticeMinutes: true,
            maximumBookingDays: true,
          },
        });
        if (!currentEstablishment) {
          throw new NotFoundException('Establishment not found');
        }

        if (payload.idempotencyKey) {
          // RETURNING tells us whether THIS request created the row. Only the
          // first claimant proceeds; a conflict means another request already
          // owns the key (in progress or completed) or a stale record remains.
          const inserted = await tx.$queryRaw<Array<{ id: string }>>`
            INSERT INTO idempotency_records (
              id, scope, idempotency_key, request_hash, created_at, expires_at
            )
            VALUES (
              gen_random_uuid(), ${scope}, ${payload.idempotencyKey}, ${requestHash}, NOW(), NOW() + INTERVAL '24 hours'
            )
            ON CONFLICT (scope, idempotency_key) DO NOTHING
            RETURNING id
          `;
          const freshlyClaimed = inserted.length > 0;

          const records = await tx.$queryRaw<
            Array<{
              request_hash: string;
              resource_id: string | null;
              expires_at: Date;
              response_body: unknown;
            }>
          >`
            SELECT request_hash, resource_id, expires_at, response_body
            FROM idempotency_records
            WHERE scope = ${scope} AND idempotency_key = ${payload.idempotencyKey}
            FOR UPDATE
          `;
          const record = records[0];

          if (!record) {
            throw new ConflictException('Unable to claim the idempotency key');
          }

          if (!freshlyClaimed) {
            if (record.expires_at > new Date()) {
              if (record.request_hash !== requestHash) {
                throw new IdempotencyKeyConflictException();
              }

              if (record.resource_id) {
                const storedBooking = await tx.booking.findUnique({
                  where: { id: record.resource_id },
                  select: {
                    id: true,
                    publicReference: true,
                    startsAt: true,
                    endsAt: true,
                    service: { select: { name: true, durationMinutes: true } },
                    employee: { select: { displayName: true } },
                  },
                });

                if (!storedBooking) {
                  throw new NotFoundException(
                    'The booking for this idempotency key no longer exists',
                  );
                }

                const cachedResponse = record.response_body as {
                  customerAccessTokenEncrypted?: string;
                } | null;
                let customerAccessToken =
                  cachedResponse?.customerAccessTokenEncrypted
                    ? this.decryptBookingAccessToken(
                        cachedResponse.customerAccessTokenEncrypted,
                      )
                    : null;
                if (!customerAccessToken) {
                  customerAccessToken = await this.createBookingAccessToken(
                    tx,
                    currentEstablishment.id,
                    storedBooking.id,
                  );
                  const encryptedToken =
                    this.encryptBookingAccessToken(customerAccessToken);
                  await tx.$executeRaw`
                    UPDATE idempotency_records
                    SET response_body = jsonb_set(
                      COALESCE(response_body, '{}'::jsonb),
                      '{customerAccessTokenEncrypted}',
                      to_jsonb(${encryptedToken}::text),
                      true
                    )
                    WHERE scope = ${scope}
                      AND idempotency_key = ${payload.idempotencyKey}
                  `;
                }

                return {
                  booking: storedBooking,
                  establishment: { name: currentEstablishment.name },
                  customerAccessToken,
                  idempotent: true,
                };
              }

              throw new ConflictException(
                'A request with this idempotency key is already in progress',
              );
            }

            // Stale record from a prior attempt that never completed: take over.
            await tx.$executeRaw`
              UPDATE idempotency_records
              SET request_hash = ${requestHash},
                  response_status = NULL,
                  response_body = NULL,
                  resource_id = NULL,
                  created_at = NOW(),
                  expires_at = NOW() + INTERVAL '24 hours'
              WHERE scope = ${scope} AND idempotency_key = ${payload.idempotencyKey}
            `;
          }
        }

        // Subscription gate and monthly booking quota (enforced server-side).
        await this.subscriptions.assertWithinBookingQuota(
          currentEstablishment.id,
          tx,
        );

        const service = await tx.service.findFirst({
          where: {
            id: payload.serviceId,
            establishmentId: currentEstablishment.id,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true,
          },
        });
        if (!service) {
          throw new NotFoundException('Service not found');
        }

        const localDate = this.getLocalDate(
          startsAt,
          currentEstablishment.timezone,
        );
        const availability = await this.getAvailability(
          service.id,
          localDate,
          payload.employeeId,
          currentEstablishment.id,
          tx,
        );
        const selectedSlot = availability.slots.find(
          (slot) => new Date(slot.start).getTime() === startsAt.getTime(),
        );
        if (!selectedSlot) {
          throw new SlotUnavailableException();
        }

        const employee = await tx.employee.findFirst({
          where: {
            id: selectedSlot.employeeId,
            establishmentId: currentEstablishment.id,
            isActive: true,
            services: { some: { serviceId: service.id } },
          },
          select: { id: true },
        });
        if (!employee) {
          throw new SlotUnavailableException();
        }

        const lockedEmployees = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM employees
          WHERE id = ${employee.id}::uuid
            AND establishment_id = ${currentEstablishment.id}::uuid
          FOR UPDATE
        `;
        if (!lockedEmployees.length) {
          throw new SlotUnavailableException();
        }
        const latestAvailability = await this.getAvailability(
          service.id,
          localDate,
          employee.id,
          currentEstablishment.id,
          tx,
        );
        if (
          !latestAvailability.slots.some(
            (slot) => new Date(slot.start).getTime() === startsAt.getTime(),
          )
        ) {
          throw new SlotUnavailableException();
        }

        const endsAt = new Date(
          startsAt.getTime() + service.durationMinutes * 60_000,
        );
        const existingConflict = await tx.booking.findFirst({
          where: {
            establishmentId: currentEstablishment.id,
            employeeId: employee.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
          select: { id: true },
        });
        if (existingConflict) {
          throw new SlotUnavailableException();
        }

        let customer = await tx.customer.findFirst({
          where: {
            establishmentId: currentEstablishment.id,
            phoneNormalized: normalizedPhone,
          },
          select: { id: true, preferredLocale: true },
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              establishmentId: currentEstablishment.id,
              name: payload.customerName.trim(),
              phoneNormalized: normalizedPhone,
              email: payload.customerEmail?.trim() || null,
              preferredLocale:
                payload.locale ??
                (currentEstablishment.locale === 'ar' ? 'ar' : 'fr'),
            },
            select: { id: true, preferredLocale: true },
          });
        } else {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: payload.customerName.trim(),
              email: payload.customerEmail?.trim() || null,
              preferredLocale: payload.locale ?? customer.preferredLocale,
            },
            select: { id: true, preferredLocale: true },
          });
        }

        const booking = await tx.booking.create({
          data: {
            establishmentId: currentEstablishment.id,
            publicReference: `BK-${randomBytes(4).toString('hex').toUpperCase()}`,
            customerId: customer.id,
            serviceId: service.id,
            employeeId: employee.id,
            startsAt,
            endsAt,
            status: 'CONFIRMED',
            source: 'WEB',
            customerNameSnapshot: payload.customerName.trim(),
            customerPhoneSnapshot: normalizedPhone,
            customerEmailSnapshot: payload.customerEmail?.trim() || null,
            serviceNameSnapshot: service.name,
            durationMinutesSnapshot: service.durationMinutes,
            priceSnapshot: service.price,
            currency: currentEstablishment.currency,
            remindersConsent: Boolean(payload.consentToReminders),
            version: 1,
          },
          select: {
            id: true,
            publicReference: true,
            startsAt: true,
            endsAt: true,
            service: { select: { name: true, durationMinutes: true } },
            employee: { select: { displayName: true } },
          },
        });
        const customerAccessToken = await this.createBookingAccessToken(
          tx,
          currentEstablishment.id,
          booking.id,
        );

        // Confirmation + reminder jobs and their outbox events are written in
        // this same transaction so a committed booking always has durable
        // notification state. Sends are gated on the customer's consent.
        await this.scheduler.scheduleForNewBooking(tx, {
          id: booking.id,
          establishmentId: currentEstablishment.id,
          startsAt,
          remindersConsent: Boolean(payload.consentToReminders),
        });

        if (payload.idempotencyKey) {
          const serializedBody = JSON.stringify({
            booking,
            establishment: { name: currentEstablishment.name },
            customerAccessTokenEncrypted:
              this.encryptBookingAccessToken(customerAccessToken),
          });
          await tx.$executeRaw`
            UPDATE idempotency_records
            SET response_status = 201,
                response_body = CAST(${serializedBody} AS jsonb),
                resource_id = ${booking.id},
                expires_at = NOW() + INTERVAL '24 hours'
            WHERE scope = ${scope} AND idempotency_key = ${payload.idempotencyKey}
          `;
        }

        return {
          booking,
          establishment: { name: currentEstablishment.name },
          customerAccessToken,
        };
      });
    } catch (error) {
      if (this.isSlotConflict(error)) {
        throw new SlotUnavailableException();
      }
      throw error;
    }
  }
}
