import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TransferOwnershipDto {
  @ApiProperty({ description: 'Active membership receiving ownership' })
  @IsUUID()
  targetMembershipId!: string;
}
