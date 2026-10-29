import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import {
  CurrentActor,
  type AuthenticatedActor,
} from '../common/current-actor.decorator.js';
import { NotificationsService } from './notifications.service.js';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto.js';

class EstablishmentScopeQueryDto {
  @IsUUID()
  establishmentId!: string;
}

@ApiTags('notifications')
@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  @ApiOperation({ summary: 'List notification jobs for an establishment' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'bookingId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async list(
    @Query() query: ListNotificationsQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.notificationsService.listNotifications(actor.userId, query);
  }

  @Get('notification-settings')
  @ApiOperation({ summary: 'Read notification settings for an establishment' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  async getSettings(
    @Query() query: EstablishmentScopeQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.notificationsService.getSettings(
      actor.userId,
      query.establishmentId,
    );
  }

  @Patch('notification-settings')
  @ApiOperation({ summary: 'Update notification settings for an establishment' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  async updateSettings(
    @Query() query: EstablishmentScopeQueryDto,
    @Body() body: UpdateNotificationSettingsDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.notificationsService.updateSettings(
      actor.userId,
      query.establishmentId,
      body,
    );
  }

  @Get('notifications/:id')
  @ApiOperation({ summary: 'Get a notification job and its delivery log' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  async getOne(
    @Param('id') id: string,
    @Query() query: EstablishmentScopeQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.notificationsService.getNotification(
      actor.userId,
      query.establishmentId,
      id,
    );
  }
}
