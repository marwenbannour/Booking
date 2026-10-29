import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class BusinessHourEntryDto {
  @ApiProperty({ minimum: 0, maximum: 6, description: 'Sunday is 0' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: '09:00' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  opensAt!: string;

  @ApiProperty({ example: '17:30' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  closesAt!: string;
}

export class SetBusinessHoursDto {
  @ApiProperty({ type: [BusinessHourEntryDto], minItems: 1, maxItems: 42 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(42)
  @ValidateNested({ each: true })
  @Type(() => BusinessHourEntryDto)
  hours!: BusinessHourEntryDto[];
}
