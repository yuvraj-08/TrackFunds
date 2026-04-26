import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length, Matches } from 'class-validator'

export class RedeemInvitationDto {
  @ApiProperty({ example: 'A3B7XKQP' })
  @IsString()
  @Length(8, 8)
  @Matches(/^[A-Z2-9]+$/u, { message: 'code must be an 8-character uppercase invite code' })
  code!: string
}
