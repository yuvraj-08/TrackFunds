import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Length } from 'class-validator'

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Shared Savings' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string

  @ApiPropertyOptional({ example: 'State Bank of India' })
  @IsOptional()
  @IsString()
  institution?: string

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string
}
