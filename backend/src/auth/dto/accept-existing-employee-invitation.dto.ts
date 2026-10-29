import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptExistingEmployeeInvitationDto {
  @ApiProperty()
  @IsString()
  @MinLength(32)
  @MaxLength(128)
  token!: string;
}
