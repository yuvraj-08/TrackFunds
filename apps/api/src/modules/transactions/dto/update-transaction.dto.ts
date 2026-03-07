import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, Matches } from 'class-validator'

import type { TransactionSource, TransactionType } from '@trackfunds/types'

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: '25.00' })
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/u)
  amount?: string

  @ApiPropertyOptional({ enum: ['DEPOSIT', 'WITHDRAWAL'] })
  @IsOptional()
  @IsIn(['DEPOSIT', 'WITHDRAWAL'])
  type?: TransactionType

  @ApiPropertyOptional({ enum: ['MANUAL', 'SMS_IMPORT'] })
  @IsOptional()
  @IsIn(['MANUAL', 'SMS_IMPORT'])
  source?: TransactionSource

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerUserId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  spentByUserId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string

  @ApiPropertyOptional({ example: '2026-03-07T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string
}
