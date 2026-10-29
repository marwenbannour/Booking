import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import type { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto.js';

type Permission = 'notifications.read' | 'notifications.write';

interface Membership {
  role: string;
  permissions: unknown;
}

const DEFAULT_SETTINGS = {
  whatsappEnabled: true,
  confirmationEnabled: true,
  cancellationEnabled: true,
  firstReminderMinutesBefore: 1440 as number | null,
  secondReminderMinutesBefore: 120 as number | null,
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async listNotifications(userId: string, query: ListNotificationsQueryDto) {
    await this.authorize(userId, query.establishmentId, 'notifications.read');

    const where: Prisma.NotificationJobWhereInput = {
      establishmentId: query.establishmentId,
    };
    if (query.status) {
      where.status = query.status;
    }
    if (query.eventType) {
      where.eventType = query.eventType;
    }
    if (query.bookingId) {
      where.bookingId = query.bookingId;
    }

    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const offset = Math.max(query.offset ?? 0, 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificationJob.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          bookingId: true,
          channel: true,
          eventType: true,
          status: true,
          scheduledAt: true,
          attempts: true,
          providerMessageId: true,
          errorCode: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.notificationJob.count({ where }),
    ]);

    return { total, limit, offset, items };
  }

  async getNotification(
    userId: string,
    establishmentId: string,
    notificationId: string,
  ) {
    await this.authorize(userId, establishmentId, 'notifications.read');

    const job = await this.prisma.notificationJob.findFirst({
      where: { id: notificationId, establishmentId },
      select: {
        id: true,
        bookingId: true,
        channel: true,
        eventType: true,
        status: true,
        scheduledAt: true,
        availableAt: true,
        attempts: true,
        providerMessageId: true,
        errorCode: true,
        createdAt: true,
        updatedAt: true,
        logs: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            provider: true,
            status: true,
            recipient: true,
            providerMessageId: true,
            errorCode: true,
            errorMessage: true,
            createdAt: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Notification not found');
    }
    return job;
  }

  async getSettings(userId: string, establishmentId: string) {
    await this.authorize(userId, establishmentId, 'notifications.read');

    const row = await this.prisma.notificationSetting.findUnique({
      where: { establishmentId },
    });
    if (!row) {
      return { establishmentId, ...DEFAULT_SETTINGS };
    }
    return {
      establishmentId,
      whatsappEnabled: row.whatsappEnabled,
      confirmationEnabled: row.confirmationEnabled,
      cancellationEnabled: row.cancellationEnabled,
      firstReminderMinutesBefore: row.firstReminderMinutesBefore,
      secondReminderMinutesBefore: row.secondReminderMinutesBefore,
    };
  }

  async updateSettings(
    userId: string,
    establishmentId: string,
    dto: UpdateNotificationSettingsDto,
  ) {
    await this.authorize(userId, establishmentId, 'notifications.write');

    const data: Prisma.NotificationSettingUncheckedUpdateInput = {};
    if (dto.whatsappEnabled !== undefined)
      data.whatsappEnabled = dto.whatsappEnabled;
    if (dto.confirmationEnabled !== undefined)
      data.confirmationEnabled = dto.confirmationEnabled;
    if (dto.cancellationEnabled !== undefined)
      data.cancellationEnabled = dto.cancellationEnabled;
    if (dto.firstReminderMinutesBefore !== undefined)
      data.firstReminderMinutesBefore = dto.firstReminderMinutesBefore;
    if (dto.secondReminderMinutesBefore !== undefined)
      data.secondReminderMinutesBefore = dto.secondReminderMinutesBefore;

    const row = await this.prisma.notificationSetting.upsert({
      where: { establishmentId },
      create: {
        establishmentId,
        whatsappEnabled: dto.whatsappEnabled ?? DEFAULT_SETTINGS.whatsappEnabled,
        confirmationEnabled:
          dto.confirmationEnabled ?? DEFAULT_SETTINGS.confirmationEnabled,
        cancellationEnabled:
          dto.cancellationEnabled ?? DEFAULT_SETTINGS.cancellationEnabled,
        firstReminderMinutesBefore:
          dto.firstReminderMinutesBefore === undefined
            ? DEFAULT_SETTINGS.firstReminderMinutesBefore
            : dto.firstReminderMinutesBefore,
        secondReminderMinutesBefore:
          dto.secondReminderMinutesBefore === undefined
            ? DEFAULT_SETTINGS.secondReminderMinutesBefore
            : dto.secondReminderMinutesBefore,
      },
      update: data,
    });

    return {
      establishmentId,
      whatsappEnabled: row.whatsappEnabled,
      confirmationEnabled: row.confirmationEnabled,
      cancellationEnabled: row.cancellationEnabled,
      firstReminderMinutesBefore: row.firstReminderMinutesBefore,
      secondReminderMinutesBefore: row.secondReminderMinutesBefore,
    };
  }
}
