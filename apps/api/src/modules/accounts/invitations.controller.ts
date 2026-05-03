import { Body, Controller, Post, Version } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '../auth/current-user.decorator.js'
import type { AuthenticatedUser } from '../auth/auth.types.js'
import { Public } from '../auth/public.decorator.js'
import { InvitationsService } from './invitations.service.js'
import { RedeemInvitationDto } from './dto/redeem-invitation.dto.js'

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Public()
  @Post('lookup')
  @Version('1')
  @ApiOperation({ summary: 'Look up an invitation by code and preview account details.' })
  lookup(@Body() body: RedeemInvitationDto) {
    return this.invitationsService.lookupInvitation(body.code)
  }

  @Post('accept')
  @Version('1')
  @ApiOperation({ summary: 'Accept an invitation and join the account.' })
  accept(@Body() body: RedeemInvitationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.invitationsService.acceptInvitation(body.code, user.id)
  }

  @Post('decline')
  @Version('1')
  @ApiOperation({ summary: 'Decline an invitation.' })
  decline(@Body() body: RedeemInvitationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.invitationsService.declineInvitation(body.code, user.id)
  }
}
