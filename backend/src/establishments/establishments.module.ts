import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { EstablishmentsManagementController } from './establishments-management.controller.js';
import { EstablishmentsManagementService } from './establishments-management.service.js';
import { PublicEstablishmentsController } from './public-establishments.controller.js';

@Module({
  imports: [BookingsModule, SubscriptionsModule],
  controllers: [
    PublicEstablishmentsController,
    EstablishmentsManagementController,
  ],
  providers: [EstablishmentsManagementService],
})
export class EstablishmentsModule {}
