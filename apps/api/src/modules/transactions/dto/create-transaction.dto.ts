import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, Matches } from 'class-validator'

import type { TransactionSource, TransactionType } from '@trackfunds/types'

export class CreateTransactionDto {
  @ApiProperty({ example: '25.00' })
  @Matches(/^\d+(\.\d{1,2})?$/u)
  amount!: string

  @ApiProperty({ enum: ['DEPOSIT', 'WITHDRAWAL'] })
  @IsIn(['DEPOSIT', 'WITHDRAWAL'])
  type!: TransactionType

  @ApiPropertyOptional({ enum: ['MANUAL', 'SMS_IMPORT'], default: 'MANUAL' })
  @IsOptional()
  @IsIn(['MANUAL', 'SMS_IMPORT'])
  source?: TransactionSource

  @ApiProperty()
  @IsUUID()
  ownerUserId!: string

  @ApiProperty()
  @IsUUID()
  spentByUserId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string

  @ApiProperty({ example: '2026-03-07T10:00:00.000Z' })
  @IsDateString()
  occurredAt!: string
}
