import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CurrentActor,
  type AuthenticatedActor,
} from '../common/current-actor.decorator.js';
import { Public } from '../common/public.decorator.js';
import { Throttle } from '../common/throttle.decorator.js';
import { BookingsService } from './bookings.service.js';
import { GetAvailabilityQueryDto } from './dto/get-availability-query.dto.js';

class PublicBookingDto {
  @IsUUID()
  serviceId!: string;

  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @IsDateString()
  startsAt!: string;

  @IsString()
  @MinLength(2)
  customerName!: string;

  @IsString()
  @MinLength(6)
  customerPhone!: string;

  @IsString()
  @IsOptional()
  @ValidateIf(
    (_, value) => value !== null && value !== undefined && value !== '',
  )
  @IsEmail()
  customerEmail?: string;

  @IsBoolean()
  consentToReminders!: boolean;

  @IsIn(['fr', 'ar'])
  @IsOptional()
  locale?: 'fr' | 'ar';
}

class BookingStatusTransitionDto {
  @IsEnum([
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'REJECTED',
  ])
  status!:
    | 'PENDING'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW'
    | 'REJECTED';

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  correlationId?: string;
}

class ListBookingsQueryDto {
  @IsUUID()
  establishmentId!: string;

  @IsOptional()
  @IsEnum([
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'REJECTED',
  ])
  status?:
    | 'PENDING'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW'
    | 'REJECTED';

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

class EstablishmentScopeQueryDto {
  @IsUUID()
  establishmentId!: string;
}

class PublicRescheduleRequestDto {
  @IsDateString()
  requestedStartsAt!: string;

  @IsUUID()
  requestedEmployeeId!: string;
}

class RescheduleRequestDecisionDto {
  @IsIn(['ACCEPTED', 'REJECTED'])
  decision!: 'ACCEPTED' | 'REJECTED';

  @IsString()
  @IsOptional()
  reason?: string;
}

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Get('availability')
  @ApiOperation({
    summary: 'List available slots for a service on a given day',
  })
  @ApiQuery({ name: 'serviceId', type: String, required: true })
  @ApiQuery({
    name: 'date',
    type: String,
    required: true,
    example: '2026-10-28',
  })
  async getAvailability(@Query() query: GetAvailabilityQueryDto) {
    return this.bookingsService.getAvailability(
      query.serviceId,
      query.date,
      query.employeeId,
    );
  }

  @Public()
  @Throttle({ limit: 20, windowSeconds: 60, name: 'public-booking-create' })
  @Post('public/:slug')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a public booking for a given establishment',
  })
  @ApiBody({ type: PublicBookingDto })
  async createPublicBooking(
    @Param('slug') slug: string,
    @Body() body: PublicBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('startsAt must be a valid ISO datetime');
    }

    return this.bookingsService.createPublicBooking({
      establishmentSlug: slug,
      serviceId: body.serviceId,
      employeeId: body.employeeId,
      startsAt,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      consentToReminders: body.consentToReminders,
      locale: body.locale,
      idempotencyKey,
    });
  }

  @Public()
  @Throttle({ limit: 10, windowSeconds: 60, name: 'public-reschedule-request' })
  @Post('public/:bookingId/reschedule-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request a new time for a public booking using its access token',
  })
  async createPublicRescheduleRequest(
    @Param('bookingId') bookingId: string,
    @Body() body: PublicRescheduleRequestDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      throw new UnauthorizedException('A booking access token is required');
    }

    return this.bookingsService.createPublicRescheduleRequest(
      bookingId,
      token,
      new Date(body.requestedStartsAt),
      body.requestedEmployeeId,
    );
  }

  @Get('reschedule-requests')
  @ApiOperation({ summary: 'List pending customer reschedule requests' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  async listRescheduleRequests(
    @Query() query: EstablishmentScopeQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.bookingsService.listRescheduleRequests(
      actor.userId,
      query.establishmentId,
    );
  }

  @Post(':id/reschedule-requests/:requestId/decision')
  @ApiOperation({ summary: 'Accept or reject a customer reschedule request' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  async decideRescheduleRequest(
    @Param('id') bookingId: string,
    @Param('requestId') requestId: string,
    @Body() body: RescheduleRequestDecisionDto,
    @Query() query: EstablishmentScopeQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.bookingsService.decideRescheduleRequest(
      actor.userId,
      query.establishmentId,
      bookingId,
      requestId,
      body.decision,
      body.reason,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List bookings with status and time filters' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'PENDING',
      'CONFIRMED',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'REJECTED',
    ],
  })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  @ApiQuery({ name: 'serviceId', required: false, type: String })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    example: '2026-10-28T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    example: '2026-10-30T23:59:59.999Z',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  async listBookings(
    @Query() query: ListBookingsQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.bookingsService.listBookings(
      actor.userId,
      query.establishmentId,
      {
        status: query.status,
        employeeId: query.employeeId,
        serviceId: query.serviceId,
        dateFrom: query.from ? new Date(query.from) : undefined,
        dateTo: query.to ? new Date(query.to) : undefined,
        limit: query.limit,
        offset: query.offset,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details and its event history' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  async getBookingDetails(
    @Param('id') bookingId: string,
    @Query() query: EstablishmentScopeQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.bookingsService.getBookingDetails(
      actor.userId,
      query.establishmentId,
      bookingId,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition a booking to a new business status' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  @ApiBody({ type: BookingStatusTransitionDto })
  async transitionBookingStatus(
    @Param('id') bookingId: string,
    @Body() body: BookingStatusTransitionDto,
    @Query() query: EstablishmentScopeQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.bookingsService.transitionBookingStatus(
      bookingId,
      body.status,
      {
        establishmentId: query.establishmentId,
        reason: body.reason,
        actorUserId: actor.userId,
        correlationId: correlationId ?? body.correlationId,
      },
    );
  }
}
