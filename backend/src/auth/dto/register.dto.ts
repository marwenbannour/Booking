import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @ApiPropertyOptional({ example: 'owner@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: '+21620123456' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;

  @ApiProperty({ minLength: 12, maxLength: 128 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Salon de Tunis' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  establishmentName!: string;

  @ApiProperty({ example: 'salon-de-tunis' })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  establishmentSlug!: string;

  @ApiPropertyOptional({ enum: ['fr', 'ar'], default: 'fr' })
  @IsOptional()
  @IsIn(['fr', 'ar'])
  locale?: 'fr' | 'ar';
}
