import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateEstablishmentDto {
  @ApiPropertyOptional({ example: 'salon-de-tunis' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiPropertyOptional({ example: 'Salon de Tunis' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ApiPropertyOptional({ example: 'Africa/Tunis' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({ example: 'TND' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @ApiPropertyOptional({ enum: ['fr', 'ar'] })
  @IsOptional()
  @IsIn(['fr', 'ar'])
  locale?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10_080 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_080)
  minimumBookingNoticeMinutes?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  maximumBookingDays?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 720 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  cancellationNoticeHours?: number;
}
