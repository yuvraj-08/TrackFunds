import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsOptional } from 'class-validator'

export class CreateInvitationDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string

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
