import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from './common/throttler.guard.js';
import { AuthModule } from './auth/auth.module.js';
import { EstablishmentsModule } from './establishments/establishments.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './database/prisma.module.js';
import { QueuesModule } from './queues/queues.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    QueuesModule,
    HealthModule,
    EstablishmentsModule,
    BookingsModule,
    NotificationsModule,
    SubscriptionsModule,
    DashboardModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
