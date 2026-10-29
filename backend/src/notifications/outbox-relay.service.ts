import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service.js';
import {
  BOOKING_NOTIFICATIONS_QUEUE,
} from '../queues/queues.module.js';
import {
  NOTIFICATION_DISPATCH_JOB,
  type DispatchJobData,
  type NotificationEventType,
} from './notification.constants.js';

interface OutboxRow {
  id: string;
  notification_job_id: string;
  establishment_id: string;
  event_type: string;
  scheduled_at: Date;
  job_status: string;
}

/**
 * Relays committed outbox events to the BullMQ notifications queue. Polls the
 * `outbox_events` table, claims a batch with `FOR UPDATE SKIP LOCKED` so
 * multiple instances cooperate safely, enqueues each event (idempotently, via a
 * stable BullMQ job id) with a delay derived from the notification job's
 * scheduled time, and marks the outbox rows as published in the same
 * transaction. Enqueue is idempotent, so a transaction rollback after a
 * successful enqueue cannot produce duplicate messages.
 */
@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private readonly enabled: boolean;
  private readonly intervalMs: number;
  private readonly batchSize: number;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(BOOKING_NOTIFICATIONS_QUEUE)
    private readonly queue: Queue<DispatchJobData>,
  ) {
    this.enabled =
      (this.config.get<string>('NOTIFICATIONS_DISPATCHER_ENABLED') ?? 'true') !==
      'false';
    this.intervalMs = Number(
      this.config.get<string>('NOTIFICATIONS_DISPATCH_INTERVAL_MS') ?? '2000',
    );
    this.batchSize = Number(
      this.config.get<string>('NOTIFICATIONS_DISPATCH_BATCH') ?? '50',
    );
  }

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log('Outbox relay disabled by configuration');
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMs);
    // Do not keep the event loop alive solely for the relay timer.
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /** Processes one batch of pending outbox events. Safe to call repeatedly. */
  async tick(): Promise<number> {
    if (this.running) {
      return 0;
    }
    this.running = true;
    try {
      return await this.drainBatch();
    } catch (error) {
      this.logger.error(
        `Outbox relay tick failed: ${(error as Error).message}`,
      );
      return 0;
    } finally {
      this.running = false;
    }
  }

  private async drainBatch(): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<OutboxRow[]>`
        SELECT oe.id,
               oe.notification_job_id,
               oe.establishment_id,
               oe.event_type,
               nj.scheduled_at,
               nj.status AS job_status
        FROM outbox_events oe
        JOIN notification_jobs nj ON nj.id = oe.notification_job_id
        WHERE oe.published_at IS NULL
        ORDER BY oe.created_at ASC
        FOR UPDATE OF oe SKIP LOCKED
        LIMIT ${this.batchSize}
      `;

      if (!rows.length) {
        return 0;
      }

      for (const row of rows) {
        // Jobs already cancelled before dispatch are marked published without
        // being enqueued — there is nothing to send.
        if (row.job_status === 'CANCELLED') {
          continue;
        }

        const delay = Math.max(0, row.scheduled_at.getTime() - Date.now());
        await this.queue.add(
          NOTIFICATION_DISPATCH_JOB,
          {
            notificationJobId: row.notification_job_id,
            establishmentId: row.establishment_id,
            eventType: row.event_type as NotificationEventType,
          },
          {
            // Stable id makes enqueue idempotent across retries/rollbacks.
            jobId: row.notification_job_id,
            delay,
          },
        );
      }

      await tx.outboxEvent.updateMany({
        where: { id: { in: rows.map((row) => row.id) } },
        data: { publishedAt: new Date(), publishAttempts: { increment: 1 } },
      });

      return rows.length;
    });
  }
}
