import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type {
  AdminAuditQueryDto,
  AdminEstablishmentsQueryDto,
  AdminSubscriptionsQueryDto,
  SetEstablishmentStatusDto,
} from './dto/admin-query.dto.js';

/**
 * Platform-wide read/administration operations. Not tenant-scoped — access is
 * restricted by {@link AdminGuard}. Sensitive status changes are audited.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private toCountMap(rows: Array<{ status: string; _count: { _all: number } }>) {
    return Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
  }

  async getOverview() {
    const [
      establishmentsTotal,
      establishmentsByStatus,
      users,
      subscriptionsByStatus,
      bookingsTotal,
      notificationsSent,
      notificationsFailed,
    ] = await Promise.all([
      this.prisma.establishment.count(),
      this.prisma.establishment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.user.count(),
      this.prisma.subscription.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.booking.count(),
      this.prisma.notificationLog.count({
        where: { status: { in: ['SENT', 'DELIVERED'] } },
      }),
      this.prisma.notificationLog.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      establishments: {
        total: establishmentsTotal,
        byStatus: this.toCountMap(establishmentsByStatus),
      },
      users,
      subscriptions: this.toCountMap(subscriptionsByStatus),
      bookings: bookingsTotal,
      notifications: { sent: notificationsSent, failed: notificationsFailed },
    };
  }

  async listEstablishments(query: AdminEstablishmentsQueryDto) {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const offset = Math.max(query.offset ?? 0, 0);
    const q = query.q?.trim();
    const where: Prisma.EstablishmentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.establishment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          createdAt: true,
          subscription: {
            select: { status: true, plan: { select: { code: true } } },
          },
          _count: {
            select: { bookings: true, employees: true, customers: true },
          },
        },
      }),
      this.prisma.establishment.count({ where }),
    ]);

    return { total, limit, offset, items };
  }

  async setEstablishmentStatus(
    adminUserId: string,
    establishmentId: string,
    dto: SetEstablishmentStatusDto,
  ) {
    const existing = await this.prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Establishment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.establishment.update({
        where: { id: establishmentId },
        data: { status: dto.status },
        select: { id: true, slug: true, name: true, status: true },
      });
      await tx.auditLog.create({
        data: {
          establishmentId,
          actorUserId: adminUserId,
          action: 'admin.establishment.status_changed',
          targetType: 'ESTABLISHMENT',
          targetId: establishmentId,
          metadata: { from: existing.status, to: dto.status },
        },
      });
      return updated;
    });
  }

  async listSubscriptions(query: AdminSubscriptionsQueryDto) {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const offset = Math.max(query.offset ?? 0, 0);
    const where: Prisma.SubscriptionWhereInput = query.status
      ? { status: query.status }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          trialEndsAt: true,
          establishment: { select: { id: true, slug: true, name: true } },
          plan: { select: { code: true, name: true } },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return { total, limit, offset, items };
  }

  async listAuditLogs(query: AdminAuditQueryDto) {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const offset = Math.max(query.offset ?? 0, 0);
    const where: Prisma.AuditLogWhereInput = query.establishmentId
      ? { establishmentId: query.establishmentId }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          establishmentId: true,
          actorUserId: true,
          action: true,
          targetType: true,
          targetId: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { total, limit, offset, items };
  }
}
