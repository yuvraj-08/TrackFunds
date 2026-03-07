import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Length } from 'class-validator'

export class CreateAccountDto {
  @ApiProperty({ example: 'Shared Savings' })
  @IsString()
  @Length(2, 120)
  name!: string

  @ApiPropertyOptional({ example: 'State Bank of India' })
  @IsOptional()
  @IsString()
  institution?: string

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string
}
