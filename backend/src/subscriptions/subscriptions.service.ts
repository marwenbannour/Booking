import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, SubscriptionStatus } from '../generated/prisma/client.js';

type DbClient = PrismaService | Prisma.TransactionClient;

const SERVICE_ACTIVE_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE'];
const BLOCKING_STATUSES = ['SUSPENDED', 'CANCELLED', 'EXPIRED'];

interface Membership {
  role: string;
  permissions: unknown;
}

class QuotaExceededException extends ForbiddenException {
  constructor(resource: string, limit: number) {
    super({
      statusCode: 403,
      code: 'QUOTA_EXCEEDED',
      message: `Your plan limit for ${resource} (${limit}) has been reached. Upgrade your plan to continue.`,
    });
  }
}

class SubscriptionInactiveException extends ForbiddenException {
  constructor() {
    super({
      statusCode: 403,
      code: 'SUBSCRIPTION_INACTIVE',
      message: 'This establishment does not have an active subscription.',
    });
  }
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Authorisation helpers
  // ---------------------------------------------------------------------------

  private async requireMembership(userId: string, establishmentId: string) {
    const membership = await this.prisma.establishmentMember.findFirst({
      where: { establishmentId, userId, status: 'ACTIVE' },
      select: { role: true, permissions: true },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this establishment',
      );
    }
    return membership;
  }

  private assertPermission(
    membership: Membership,
    permission: 'subscriptions.read' | 'subscriptions.write',
  ) {
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
    // Reads: owner/manager. Writes (billing): owner only.
    const isRead = permission.endsWith('.read');
    const defaultAllowed = isRead
      ? ['OWNER', 'MANAGER'].includes(membership.role)
      : membership.role === 'OWNER';

    if (explicit === false || (explicit !== true && !defaultAllowed)) {
      throw new ForbiddenException(
        `You do not have permission to ${permission.replace('.', ' ')}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Period / plan resolution
  // ---------------------------------------------------------------------------

  private monthWindow(now = new Date()): { start: Date; end: Date } {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    return { start, end };
  }

  private addInterval(from: Date, interval: string): Date {
    const next = new Date(from);
    if (interval === 'YEAR') {
      next.setUTCFullYear(next.getUTCFullYear() + 1);
    } else {
      next.setUTCMonth(next.getUTCMonth() + 1);
    }
    return next;
  }

  /**
   * Resolves the plan and billing period that currently govern an
   * establishment. When no subscription exists, the seeded `free` plan applies
   * implicitly so quotas are always enforced. Returns `plan: null` only when no
   * plan can be resolved at all (fail open) — never to bypass a blocking state.
   */
  private async resolveContext(establishmentId: string, db: DbClient) {
    const subscription = await db.subscription.findUnique({
      where: { establishmentId },
      include: { plan: true },
    });

    const blocking =
      subscription !== null && BLOCKING_STATUSES.includes(subscription.status);
    let plan = subscription?.plan ?? null;
    if (!plan) {
      plan = await db.subscriptionPlan.findUnique({ where: { code: 'free' } });
    }

    const period =
      subscription?.currentPeriodStart && subscription.currentPeriodEnd
        ? {
            start: subscription.currentPeriodStart,
            end: subscription.currentPeriodEnd,
          }
        : this.monthWindow();

    return { subscription, plan, blocking, period };
  }

  // ---------------------------------------------------------------------------
  // Quota enforcement (called from other modules' create paths)
  // ---------------------------------------------------------------------------

  async assertEstablishmentActiveForBookings(
    establishmentId: string,
    db: DbClient = this.prisma,
  ): Promise<void> {
    const { blocking } = await this.resolveContext(establishmentId, db);
    if (blocking) {
      throw new SubscriptionInactiveException();
    }
  }

  async assertWithinEmployeeQuota(
    establishmentId: string,
    db: DbClient = this.prisma,
  ): Promise<void> {
    const { plan } = await this.resolveContext(establishmentId, db);
    if (!plan || plan.maxEmployees == null) {
      return;
    }
    const count = await db.employee.count({
      where: { establishmentId, isActive: true },
    });
    if (count >= plan.maxEmployees) {
      throw new QuotaExceededException('employees', plan.maxEmployees);
    }
  }

  async assertWithinBookingQuota(
    establishmentId: string,
    db: DbClient = this.prisma,
  ): Promise<void> {
    const { plan, period, blocking } = await this.resolveContext(
      establishmentId,
      db,
    );
    if (blocking) {
      throw new SubscriptionInactiveException();
    }
    if (!plan || plan.maxBookingsPerMonth == null) {
      return;
    }
    const count = await db.booking.count({
      where: {
        establishmentId,
        createdAt: { gte: period.start, lt: period.end },
      },
    });
    if (count >= plan.maxBookingsPerMonth) {
      throw new QuotaExceededException('bookings', plan.maxBookingsPerMonth);
    }
  }

  /**
   * Whether the notification quota for the current period is already reached.
   * Counts messages actually handed to the provider (SENT/DELIVERED).
   */
  async isNotificationQuotaExceeded(
    establishmentId: string,
    db: DbClient = this.prisma,
  ): Promise<boolean> {
    const { plan, period } = await this.resolveContext(establishmentId, db);
    if (!plan || plan.maxNotificationsPerMonth == null) {
      return false;
    }
    const count = await db.notificationLog.count({
      where: {
        establishmentId,
        status: { in: ['SENT', 'DELIVERED'] },
        createdAt: { gte: period.start, lt: period.end },
      },
    });
    return count >= plan.maxNotificationsPerMonth;
  }

  // ---------------------------------------------------------------------------
  // Public / management API
  // ---------------------------------------------------------------------------

  /**
   * Quota consumption for the current period, without authorization — callers
   * (e.g. the dashboard) authorize their own access first.
   */
  async getQuotaUsage(establishmentId: string) {
    const { plan, period } = await this.resolveContext(
      establishmentId,
      this.prisma,
    );
    const [employees, bookings, notifications] = await Promise.all([
      this.prisma.employee.count({
        where: { establishmentId, isActive: true },
      }),
      this.prisma.booking.count({
        where: {
          establishmentId,
          createdAt: { gte: period.start, lt: period.end },
        },
      }),
      this.prisma.notificationLog.count({
        where: {
          establishmentId,
          status: { in: ['SENT', 'DELIVERED'] },
          createdAt: { gte: period.start, lt: period.end },
        },
      }),
    ]);
    return {
      planCode: plan?.code ?? null,
      periodStart: period.start,
      periodEnd: period.end,
      employees: { used: employees, limit: plan?.maxEmployees ?? null },
      bookings: { used: bookings, limit: plan?.maxBookingsPerMonth ?? null },
      notifications: {
        used: notifications,
        limit: plan?.maxNotificationsPerMonth ?? null,
      },
    };
  }

  async listPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        priceAmount: true,
        currency: true,
        interval: true,
        trialDays: true,
        maxEmployees: true,
        maxBookingsPerMonth: true,
        maxNotificationsPerMonth: true,
        maxEstablishments: true,
      },
    });
    return { items: plans };
  }

  async getCurrent(userId: string, establishmentId: string) {
    const membership = await this.requireMembership(userId, establishmentId);
    this.assertPermission(membership, 'subscriptions.read');

    const { subscription, plan, period } = await this.resolveContext(
      establishmentId,
      this.prisma,
    );

    const [employees, bookings, notifications] = await Promise.all([
      this.prisma.employee.count({
        where: { establishmentId, isActive: true },
      }),
      this.prisma.booking.count({
        where: {
          establishmentId,
          createdAt: { gte: period.start, lt: period.end },
        },
      }),
      this.prisma.notificationLog.count({
        where: {
          establishmentId,
          status: { in: ['SENT', 'DELIVERED'] },
          createdAt: { gte: period.start, lt: period.end },
        },
      }),
    ]);

    return {
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialEndsAt: subscription.trialEndsAt,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      plan: plan
        ? { code: plan.code, name: plan.name, isImplicitFree: !subscription }
        : null,
      usage: {
        periodStart: period.start,
        periodEnd: period.end,
        employees: { used: employees, limit: plan?.maxEmployees ?? null },
        bookings: { used: bookings, limit: plan?.maxBookingsPerMonth ?? null },
        notifications: {
          used: notifications,
          limit: plan?.maxNotificationsPerMonth ?? null,
        },
      },
    };
  }

  async subscribe(userId: string, establishmentId: string, planCode: string) {
    const membership = await this.requireMembership(userId, establishmentId);
    this.assertPermission(membership, 'subscriptions.write');

    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.subscriptionPlan.findFirst({
        where: { code: planCode, isActive: true },
      });
      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }

      const existing = await tx.subscription.findUnique({
        where: { establishmentId },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException({
          statusCode: 409,
          code: 'SUBSCRIPTION_EXISTS',
          message:
            'This establishment already has a subscription. Use change-plan instead.',
        });
      }

      const now = new Date();
      const { status, trialEndsAt } = this.initialStatus(plan, now);
      const subscription = await tx.subscription.create({
        data: {
          establishmentId,
          planId: plan.id,
          status,
          currentPeriodStart: now,
          currentPeriodEnd: this.addInterval(now, plan.interval),
          trialEndsAt,
        },
        select: {
          id: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          trialEndsAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          establishmentId,
          action: 'subscription.created',
          targetType: 'SUBSCRIPTION',
          targetId: subscription.id,
          metadata: { planCode, status },
        },
      });

      return { subscription, plan: { code: plan.code, name: plan.name } };
    });
  }

  async changePlan(userId: string, establishmentId: string, planCode: string) {
    const membership = await this.requireMembership(userId, establishmentId);
    this.assertPermission(membership, 'subscriptions.write');

    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.subscriptionPlan.findFirst({
        where: { code: planCode, isActive: true },
      });
      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }

      const current = await tx.subscription.findUnique({
        where: { establishmentId },
        select: { id: true, planId: true, status: true },
      });
      if (!current) {
        throw new NotFoundException(
          'No subscription to change. Subscribe to a plan first.',
        );
      }
      if (current.planId === plan.id) {
        throw new ConflictException({
          statusCode: 409,
          code: 'SAME_PLAN',
          message: 'The establishment is already on this plan.',
        });
      }

      // A free plan is immediately active; a paid plan keeps the current
      // service-active status, otherwise it awaits payment.
      const nextStatus: SubscriptionStatus =
        Number(plan.priceAmount) === 0
          ? SubscriptionStatus.ACTIVE
          : SERVICE_ACTIVE_STATUSES.includes(current.status)
            ? current.status
            : SubscriptionStatus.PAST_DUE;

      const updated = await tx.subscription.update({
        where: { establishmentId },
        data: {
          planId: plan.id,
          status: nextStatus,
          cancelAtPeriodEnd: false,
        },
        select: {
          id: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          establishmentId,
          action: 'subscription.plan_changed',
          targetType: 'SUBSCRIPTION',
          targetId: updated.id,
          metadata: {
            fromPlanId: current.planId,
            toPlanCode: planCode,
            status: nextStatus,
          },
        },
      });

      return { subscription: updated, plan: { code: plan.code, name: plan.name } };
    });
  }

  private initialStatus(
    plan: { priceAmount: Prisma.Decimal; trialDays: number },
    now: Date,
  ): { status: SubscriptionStatus; trialEndsAt: Date | null } {
    if (Number(plan.priceAmount) === 0) {
      return { status: SubscriptionStatus.ACTIVE, trialEndsAt: null };
    }
    if (plan.trialDays > 0) {
      return {
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: new Date(now.getTime() + plan.trialDays * 86_400_000),
      };
    }
    // Paid plan without trial: active once payment is confirmed.
    return { status: SubscriptionStatus.PAST_DUE, trialEndsAt: null };
  }
}
