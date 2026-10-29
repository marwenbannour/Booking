import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { eachLocalDate, localDayWindow } from './dashboard-time.util.js';

interface Membership {
  role: string;
  permissions: unknown;
}

// Upper bound on a reporting window to keep aggregation cheap.
const MAX_WINDOW_DAYS = 186;
const DEFAULT_WINDOW_DAYS = 30;

type GroupBy = 'day' | 'employee' | 'service' | 'status';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  private assertPermission(membership: Membership) {
    const permissions =
      membership.permissions &&
      typeof membership.permissions === 'object' &&
      !Array.isArray(membership.permissions)
        ? (membership.permissions as Record<string, unknown>)
        : {};
    const explicit = ['reports.read', 'reports:read']
      .filter((key) => Object.hasOwn(permissions, key))
      .map((key) => permissions[key])[0];
    const defaultAllowed = ['OWNER', 'MANAGER'].includes(membership.role);
    if (explicit === false || (explicit !== true && !defaultAllowed)) {
      throw new ForbiddenException('You do not have permission to reports read');
    }
  }

  private async authorize(userId: string, establishmentId: string) {
    const membership = await this.prisma.establishmentMember.findFirst({
      where: { establishmentId, userId, status: 'ACTIVE' },
      select: { role: true, permissions: true },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this establishment',
      );
    }
    this.assertPermission(membership);

    const establishment = await this.prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { timezone: true },
    });
    if (!establishment) {
      throw new ForbiddenException('Establishment not found');
    }
    return establishment;
  }

  private resolvePeriod(
    from?: Date,
    to?: Date,
  ): { start: Date; end: Date } {
    const end = to ?? new Date();
    const start =
      from ?? new Date(end.getTime() - DEFAULT_WINDOW_DAYS * 86_400_000);
    if (start >= end) {
      throw new BadRequestException('`from` must be before `to`');
    }
    const days = (end.getTime() - start.getTime()) / 86_400_000;
    if (days > MAX_WINDOW_DAYS) {
      throw new BadRequestException(
        `The reporting window cannot exceed ${MAX_WINDOW_DAYS} days`,
      );
    }
    return { start, end };
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  async getSummary(
    userId: string,
    establishmentId: string,
    range: { from?: Date; to?: Date },
  ) {
    const establishment = await this.authorize(userId, establishmentId);
    const now = new Date();
    const { start, end } = this.resolvePeriod(range.from, range.to);
    const today = localDayWindow(establishment.timezone, now);

    const periodWhere = { establishmentId, startsAt: { gte: start, lt: end } };

    const [
      todayCount,
      upcoming,
      completed,
      cancelled,
      noShow,
      newCustomers,
      notificationsSent,
      notificationsFailed,
      bookedMinutes,
      topServicesRaw,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: {
          establishmentId,
          startsAt: { gte: today.start, lt: today.end },
          status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
        },
      }),
      this.prisma.booking.count({
        where: {
          establishmentId,
          startsAt: { gt: now },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
      this.prisma.booking.count({
        where: { ...periodWhere, status: 'COMPLETED' },
      }),
      this.prisma.booking.count({
        where: { ...periodWhere, status: 'CANCELLED' },
      }),
      this.prisma.booking.count({
        where: { ...periodWhere, status: 'NO_SHOW' },
      }),
      this.prisma.customer.count({
        where: { establishmentId, createdAt: { gte: start, lt: end } },
      }),
      this.prisma.notificationLog.count({
        where: {
          establishmentId,
          status: { in: ['SENT', 'DELIVERED'] },
          createdAt: { gte: start, lt: end },
        },
      }),
      this.prisma.notificationLog.count({
        where: {
          establishmentId,
          status: 'FAILED',
          createdAt: { gte: start, lt: end },
        },
      }),
      this.prisma.booking.aggregate({
        where: { ...periodWhere, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { durationMinutesSnapshot: true },
      }),
      this.prisma.booking.groupBy({
        by: ['serviceId'],
        where: { ...periodWhere, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _count: { _all: true },
        orderBy: { _count: { serviceId: 'desc' } },
        take: 5,
      }),
    ]);

    const serviceIds = topServicesRaw.map((row) => row.serviceId);
    const serviceNames = serviceIds.length
      ? await this.prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(serviceNames.map((s) => [s.id, s.name]));
    const topServices = topServicesRaw.map((row) => ({
      serviceId: row.serviceId,
      name: nameById.get(row.serviceId) ?? null,
      count: row._count._all,
    }));

    const capacityMinutes = await this.computeCapacityMinutes(
      establishmentId,
      establishment.timezone,
      start,
      end,
    );
    const booked = bookedMinutes._sum.durationMinutesSnapshot ?? 0;
    const occupancyRate =
      capacityMinutes > 0
        ? Math.min(1, Math.round((booked / capacityMinutes) * 1000) / 1000)
        : null;

    const quota = await this.subscriptions.getQuotaUsage(establishmentId);

    return {
      period: { from: start, to: end },
      today: todayCount,
      upcoming,
      completed,
      cancellations: cancelled,
      noShows: noShow,
      newCustomers,
      topServices,
      occupancy: {
        bookedMinutes: booked,
        capacityMinutes,
        rate: occupancyRate,
        rule: 'Booked minutes (CONFIRMED+COMPLETED) over working-hours capacity across active employees in the window.',
      },
      notifications: {
        sent: notificationsSent,
        failed: notificationsFailed,
      },
      quota,
    };
  }

  /**
   * Working-hours capacity (minutes) across active employees for the window.
   * Per local day, each employee contributes their own business hours when set,
   * otherwise the establishment hours, otherwise a 09:00–18:00 default — the
   * same precedence the availability engine uses. Approximate: it counts whole
   * local days covered by the window.
   */
  private async computeCapacityMinutes(
    establishmentId: string,
    timezone: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const [employees, businessHours] = await Promise.all([
      this.prisma.employee.findMany({
        where: { establishmentId, isActive: true },
        select: { id: true },
      }),
      this.prisma.businessHour.findMany({
        where: { establishmentId },
        select: {
          employeeId: true,
          dayOfWeek: true,
          opensAt: true,
          closesAt: true,
        },
      }),
    ]);

    if (!employees.length) {
      return 0;
    }

    const minutesOf = (opensAt: Date, closesAt: Date) =>
      Math.max(
        0,
        (closesAt.getUTCHours() * 60 + closesAt.getUTCMinutes()) -
          (opensAt.getUTCHours() * 60 + opensAt.getUTCMinutes()),
      );

    // Map `${employeeId|'EST'}:${dow}` -> total minutes for that weekday.
    const byKey = new Map<string, number>();
    for (const hour of businessHours) {
      const key = `${hour.employeeId ?? 'EST'}:${hour.dayOfWeek}`;
      byKey.set(key, (byKey.get(key) ?? 0) + minutesOf(hour.opensAt, hour.closesAt));
    }
    const employeeHasOverride = new Set(
      businessHours
        .filter((h) => h.employeeId !== null)
        .map((h) => h.employeeId as string),
    );

    const days = eachLocalDate(timezone, start, end);
    let capacity = 0;
    for (const day of days) {
      for (const employee of employees) {
        if (employeeHasOverride.has(employee.id)) {
          capacity += byKey.get(`${employee.id}:${day.dow}`) ?? 0;
        } else if (byKey.has(`EST:${day.dow}`)) {
          capacity += byKey.get(`EST:${day.dow}`) ?? 0;
        } else {
          capacity += 9 * 60; // default 09:00–18:00
        }
      }
    }
    return capacity;
  }

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------

  async getBookingsReport(
    userId: string,
    establishmentId: string,
    range: { from?: Date; to?: Date; groupBy?: GroupBy },
  ) {
    const establishment = await this.authorize(userId, establishmentId);
    const { start, end } = this.resolvePeriod(range.from, range.to);
    const groupBy = range.groupBy ?? 'day';

    if (groupBy === 'day') {
      const rows = await this.prisma.$queryRaw<
        Array<{ bucket: Date; count: bigint }>
      >`
        SELECT date_trunc('day', starts_at AT TIME ZONE ${establishment.timezone}) AS bucket,
               COUNT(*)::bigint AS count
        FROM bookings
        WHERE establishment_id = ${establishmentId}::uuid
          AND starts_at >= ${start} AND starts_at < ${end}
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      return {
        groupBy,
        buckets: rows.map((row) => ({
          key: row.bucket.toISOString().slice(0, 10),
          count: Number(row.count),
        })),
      };
    }

    const field =
      groupBy === 'employee'
        ? 'employeeId'
        : groupBy === 'service'
          ? 'serviceId'
          : 'status';
    const rows = await this.prisma.booking.groupBy({
      by: [field],
      where: { establishmentId, startsAt: { gte: start, lt: end } },
      _count: { _all: true },
    });

    let labels = new Map<string, string>();
    if (groupBy === 'employee') {
      const employees = await this.prisma.employee.findMany({
        where: { establishmentId },
        select: { id: true, displayName: true },
      });
      labels = new Map(employees.map((e) => [e.id, e.displayName]));
    } else if (groupBy === 'service') {
      const services = await this.prisma.service.findMany({
        where: { establishmentId },
        select: { id: true, name: true },
      });
      labels = new Map(services.map((s) => [s.id, s.name]));
    }

    return {
      groupBy,
      buckets: rows
        .map((row) => {
          const key = String((row as Record<string, unknown>)[field]);
          return {
            key,
            label: labels.get(key) ?? undefined,
            count: row._count._all,
          };
        })
        .sort((a, b) => b.count - a.count),
    };
  }

  async getNotificationsReport(
    userId: string,
    establishmentId: string,
    range: { from?: Date; to?: Date; groupBy?: 'status' | 'eventType' | 'day' },
  ) {
    const establishment = await this.authorize(userId, establishmentId);
    const { start, end } = this.resolvePeriod(range.from, range.to);
    const groupBy = range.groupBy ?? 'status';

    if (groupBy === 'day') {
      const rows = await this.prisma.$queryRaw<
        Array<{ bucket: Date; count: bigint }>
      >`
        SELECT date_trunc('day', created_at AT TIME ZONE ${establishment.timezone}) AS bucket,
               COUNT(*)::bigint AS count
        FROM notification_logs
        WHERE establishment_id = ${establishmentId}::uuid
          AND created_at >= ${start} AND created_at < ${end}
        GROUP BY bucket
        ORDER BY bucket ASC
      `;
      return {
        groupBy,
        buckets: rows.map((row) => ({
          key: row.bucket.toISOString().slice(0, 10),
          count: Number(row.count),
        })),
      };
    }

    const field = groupBy === 'eventType' ? 'eventType' : 'status';
    const rows = await this.prisma.notificationLog.groupBy({
      by: [field],
      where: { establishmentId, createdAt: { gte: start, lt: end } },
      _count: { _all: true },
    });
    return {
      groupBy,
      buckets: rows
        .map((row) => ({
          key: String((row as Record<string, unknown>)[field]),
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
