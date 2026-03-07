import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js'

export class ListAccountsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string
}
