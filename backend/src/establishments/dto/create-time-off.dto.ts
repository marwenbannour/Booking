import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTimeOffDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: '2026-11-02T09:00:00+01:00' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-11-02T12:00:00+01:00' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
