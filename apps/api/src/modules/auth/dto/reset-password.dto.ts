import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class ResetPasswordDto {
  @ApiProperty({
    example: 'f8d57f60516a845eb6557d69bf987c89ef2ad1040da2762e8470bfe61aa4f945',
  })
  @IsString()
  token!: string

  @ApiProperty({ example: 'new-strong-password-123' })
  @IsString()
  @MinLength(8)
  newPassword!: string
}
