import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsUUID } from 'class-validator'

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js'

export class ListTransactionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['DEPOSIT', 'WITHDRAWAL'] })
  @IsOptional()
  @IsIn(['DEPOSIT', 'WITHDRAWAL'])
  type?: 'DEPOSIT' | 'WITHDRAWAL'

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerUserId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  spentByUserId?: string
}
