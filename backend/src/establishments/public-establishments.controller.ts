import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Public } from '../common/public.decorator.js';
import { Throttle } from '../common/throttle.decorator.js';
import { PrismaService } from '../database/prisma.service.js';
import { EstablishmentStatus } from '../generated/prisma/client.js';
import { BookingsService } from '../bookings/bookings.service.js';
import { GetAvailabilityQueryDto } from '../bookings/dto/get-availability-query.dto.js';

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
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsEmail()
  customerEmail?: string;

  @IsBoolean()
  consentToReminders!: boolean;
}

class PublicEmployeesQueryDto {
  @IsUUID()
  serviceId!: string;
}

@ApiTags('public establishments')
@Public()
@Controller('public/establishments')
export class PublicEstablishmentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get the public profile of an establishment' })
  async getBySlug(@Param('slug') slug: string) {
    const establishment = await this.prisma.establishment.findFirst({
      where: { slug, status: EstablishmentStatus.ACTIVE },
      select: {
        slug: true,
        name: true,
        description: true,
        address: true,
        timezone: true,
        currency: true,
        locale: true,
      },
    });

    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }

    return establishment;
  }

  @Get(':slug/services')
  @ApiOperation({ summary: 'List active services on a public booking page' })
  async getServices(@Param('slug') slug: string) {
    const establishment = await this.prisma.establishment.findFirst({
      where: { slug, status: EstablishmentStatus.ACTIVE },
      select: { id: true, currency: true },
    });

    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }

    const services = await this.prisma.service.findMany({
      where: { establishmentId: establishment.id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
      },
      orderBy: { name: 'asc' },
    });

    return { currency: establishment.currency, services };
  }

  @Get(':slug/employees')
  @ApiOperation({ summary: 'List active employees offering a public service' })
  async getEmployees(
    @Param('slug') slug: string,
    @Query() query: PublicEmployeesQueryDto,
  ) {
    const service = await this.prisma.service.findFirst({
      where: {
        id: query.serviceId,
        isActive: true,
        establishment: { slug, status: EstablishmentStatus.ACTIVE },
      },
      select: { establishmentId: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.employee.findMany({
      where: {
        establishmentId: service.establishmentId,
        isActive: true,
        services: { some: { serviceId: query.serviceId } },
      },
      orderBy: { displayName: 'asc' },
      select: { id: true, displayName: true },
    });
  }

  @Get(':slug/availability')
  @ApiOperation({ summary: 'List public availability for a service and date' })
  @ApiQuery({ name: 'serviceId', type: String, required: true })
  @ApiQuery({ name: 'date', type: String, required: true, example: '2026-10-28' })
  async getAvailability(@Param('slug') slug: string, @Query() query: GetAvailabilityQueryDto) {
    const establishment = await this.prisma.establishment.findFirst({
      where: { slug, status: EstablishmentStatus.ACTIVE },
      select: { id: true },
    });

    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }

    return this.bookingsService.getAvailability(query.serviceId, query.date, query.employeeId, establishment.id);
  }

  @Throttle({ limit: 20, windowSeconds: 60, name: 'public-booking-create' })
  @Post(':slug/bookings')
  @ApiOperation({ summary: 'Create a public booking for a given establishment' })
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
      idempotencyKey,
    });
  }
}
