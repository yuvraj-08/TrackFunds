import { Module } from '@nestjs/common'

import { MailerModule } from '../mailer/mailer.module.js'
import { AccountsController } from './accounts.controller.js'
import { AccountsService } from './accounts.service.js'
import { InvitationsController } from './invitations.controller.js'
import { InvitationsService } from './invitations.service.js'

@Module({
  imports: [MailerModule],
  controllers: [AccountsController, InvitationsController],
  providers: [AccountsService, InvitationsService],
  exports: [AccountsService, InvitationsService],
})
export class AccountsModule {}
