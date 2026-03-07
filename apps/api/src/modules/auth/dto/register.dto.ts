import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'Yuvraj' })
  @IsString()
  @MinLength(2)
  displayName!: string

  @ApiProperty({ example: 'strong-password-123' })
  @IsString()
  @MinLength(8)
  password!: string
}
