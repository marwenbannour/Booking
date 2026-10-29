import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import {
  CurrentActor,
  type AuthenticatedActor,
} from '../common/current-actor.decorator.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { SubscribeDto } from './dto/subscribe.dto.js';

class EstablishmentScopeQueryDto {
  @IsUUID()
  establishmentId!: string;
}

@ApiTags('subscriptions')
@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('subscription-plans')
  @ApiOperation({ summary: 'List publicly available subscription plans' })
  async listPlans() {
    return this.subscriptions.listPlans();
  }

  @Get('subscriptions/current')
  @ApiOperation({
    summary: 'Get the current subscription and quota usage for an establishment',
  })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  async getCurrent(
    @Query() query: EstablishmentScopeQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.subscriptions.getCurrent(actor.userId, query.establishmentId);
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Subscribe an establishment to a plan' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  async subscribe(
    @Query() query: EstablishmentScopeQueryDto,
    @Body() body: SubscribeDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.subscriptions.subscribe(
      actor.userId,
      query.establishmentId,
      body.planCode,
    );
  }

  @Post('subscriptions/change-plan')
  @ApiOperation({ summary: 'Change the plan of an existing subscription' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  async changePlan(
    @Query() query: EstablishmentScopeQueryDto,
    @Body() body: SubscribeDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.subscriptions.changePlan(
      actor.userId,
      query.establishmentId,
      body.planCode,
    );
  }
}
