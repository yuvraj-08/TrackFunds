import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'

export class UpdateParticipantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canView?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canAddTransactions?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canEditTransactions?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canDeleteTransactions?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canManageParticipants?: boolean
}
