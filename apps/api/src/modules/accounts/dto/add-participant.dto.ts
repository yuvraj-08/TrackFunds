import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsUUID } from 'class-validator'

export class AddParticipantDto {
  @ApiProperty({ example: 'a2cf4e4b-0fa6-4e0c-af12-0f3835b7174d' })
  @IsUUID()
  userId!: string

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  canView?: boolean

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canAddTransactions?: boolean

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canEditTransactions?: boolean

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canDeleteTransactions?: boolean

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canManageParticipants?: boolean
}
