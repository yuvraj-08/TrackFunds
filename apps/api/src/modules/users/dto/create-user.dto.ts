import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'Yuvraj' })
  @IsString()
  @MinLength(2)
  displayName!: string

  @ApiProperty({ example: 'hashed-password-placeholder' })
  @IsString()
  @MinLength(8)
  passwordHash!: string
}
