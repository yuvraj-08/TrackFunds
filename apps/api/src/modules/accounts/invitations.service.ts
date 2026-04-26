import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { and, eq } from 'drizzle-orm'

import { accountInvitations, accountParticipants, users } from '@trackfunds/database'

import { generateInviteCode, hashInviteCode } from '../auth/crypto.js'
import { MailerService } from '../mailer/mailer.service.js'
import { AccountsService } from './accounts.service.js'
import { CreateInvitationDto } from './dto/create-invitation.dto.js'
import { DatabaseService } from '../database/database.service.js'

const INVITE_EXPIRY_DAYS = 7

@Injectable()
export class InvitationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly accountsService: AccountsService,
    private readonly mailer: MailerService,
  ) {}

  async createInvitation(
    accountId: string,
    actingUserId: string,
    input: CreateInvitationDto,
  ) {
    const account = await this.accountsService.getAccountById(accountId)
    await this.accountsService.assertCanManageParticipants(accountId, actingUserId)

    // Block if invitee is already a participant
    const existingParticipant = await this.db.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.accountId, accountId),
        // join via user email
      ),
      with: { user: true },
    })

    const allParticipants = await this.db.db.query.accountParticipants.findMany({
      where: eq(accountParticipants.accountId, accountId),
      with: { user: true },
    })

    const alreadyParticipant = allParticipants.some(
      (p) => p.user.email.toLowerCase() === input.email.toLowerCase(),
    )

    if (alreadyParticipant) {
      throw new BadRequestException('This user is already a participant in this account.')
    }

    // Cancel any existing pending invite for same email+account
    const existingInvite = await this.db.db.query.accountInvitations.findFirst({
      where: and(
        eq(accountInvitations.accountId, accountId),
        eq(accountInvitations.email, input.email.toLowerCase()),
        eq(accountInvitations.status, 'PENDING'),
      ),
    })

    if (existingInvite) {
      await this.db.db
        .update(accountInvitations)
        .set({ status: 'CANCELLED' })
        .where(eq(accountInvitations.id, existingInvite.id))
    }

    const code = generateInviteCode()
    const codeHash = hashInviteCode(code)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

    const inviter = await this.db.db.query.users.findFirst({
      where: eq(users.id, actingUserId),
    })

    const [invitation] = await this.db.db
      .insert(accountInvitations)
      .values({
        accountId,
        invitedByUserId: actingUserId,
        email: input.email.toLowerCase(),
        codeHash,
        status: 'PENDING',
        canView: input.canView ?? true,
        canAddTransactions: input.canAddTransactions ?? false,
        canEditTransactions: input.canEditTransactions ?? false,
        canDeleteTransactions: input.canDeleteTransactions ?? false,
        canManageParticipants: input.canManageParticipants ?? false,
        expiresAt,
      })
      .returning()

    if (!invitation) {
      throw new BadRequestException('Invitation could not be created.')
    }

    await this.mailer.sendInvitationEmail({
      to: input.email,
      inviterName: inviter?.displayName ?? 'Someone',
      accountName: account.name,
      code,
      expiresAt,
    })

    return { ...invitation, code }
  }

  async listInvitations(accountId: string, actingUserId: string) {
    await this.accountsService.getAccountById(accountId)
    await this.accountsService.assertCanManageParticipants(accountId, actingUserId)

    return this.db.db.query.accountInvitations.findMany({
      where: and(
        eq(accountInvitations.accountId, accountId),
        eq(accountInvitations.status, 'PENDING'),
      ),
      with: { invitedBy: true, account: true },
      // newest first
    })
  }

  async cancelInvitation(
    accountId: string,
    invitationId: string,
    actingUserId: string,
  ) {
    await this.accountsService.assertCanManageParticipants(accountId, actingUserId)

    const invitation = await this.db.db.query.accountInvitations.findFirst({
      where: and(
        eq(accountInvitations.id, invitationId),
        eq(accountInvitations.accountId, accountId),
        eq(accountInvitations.status, 'PENDING'),
      ),
    })

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already resolved.')
    }

    await this.db.db
      .update(accountInvitations)
      .set({ status: 'CANCELLED' })
      .where(eq(accountInvitations.id, invitationId))

    return { message: 'Invitation cancelled.', invitationId }
  }

  async lookupInvitation(code: string) {
    const codeHash = hashInviteCode(code)

    const invitation = await this.db.db.query.accountInvitations.findFirst({
      where: eq(accountInvitations.codeHash, codeHash),
      with: { account: { with: { owner: true } }, invitedBy: true },
    })

    if (!invitation) {
      throw new NotFoundException('Invite code not found.')
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        `This invitation has already been ${invitation.status.toLowerCase()}.`,
      )
    }

    if (invitation.expiresAt < new Date()) {
      await this.db.db
        .update(accountInvitations)
        .set({ status: 'CANCELLED' })
        .where(eq(accountInvitations.id, invitation.id))
      throw new BadRequestException('This invitation has expired.')
    }

    return {
      id: invitation.id,
      email: invitation.email,
      accountName: invitation.account.name,
      accountId: invitation.accountId,
      accountCurrencyCode: invitation.account.currencyCode,
      invitedByName: invitation.invitedBy.displayName,
      expiresAt: invitation.expiresAt,
      permissions: {
        canView: invitation.canView,
        canAddTransactions: invitation.canAddTransactions,
        canEditTransactions: invitation.canEditTransactions,
        canDeleteTransactions: invitation.canDeleteTransactions,
        canManageParticipants: invitation.canManageParticipants,
      },
    }
  }

  async acceptInvitation(code: string, actingUserId: string) {
    const codeHash = hashInviteCode(code)

    const invitation = await this.db.db.query.accountInvitations.findFirst({
      where: eq(accountInvitations.codeHash, codeHash),
      with: { account: true },
    })

    if (!invitation) throw new NotFoundException('Invite code not found.')
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        `This invitation has already been ${invitation.status.toLowerCase()}.`,
      )
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired.')
    }

    // Check acting user's email matches
    const actingUser = await this.db.db.query.users.findFirst({
      where: eq(users.id, actingUserId),
    })

    if (!actingUser) throw new NotFoundException('User not found.')

    if (actingUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException(
        'This invitation was sent to a different email address.',
      )
    }

    // Already a participant?
    const existing = await this.db.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.accountId, invitation.accountId),
        eq(accountParticipants.userId, actingUserId),
      ),
    })

    if (existing) {
      throw new BadRequestException('You are already a participant in this account.')
    }

    // Create participant + mark accepted
    await this.db.db.insert(accountParticipants).values({
      accountId: invitation.accountId,
      userId: actingUserId,
      canView: invitation.canView,
      canAddTransactions: invitation.canAddTransactions,
      canEditTransactions: invitation.canEditTransactions,
      canDeleteTransactions: invitation.canDeleteTransactions,
      canManageParticipants: invitation.canManageParticipants,
    })

    await this.db.db
      .update(accountInvitations)
      .set({ status: 'ACCEPTED', acceptedAt: new Date() })
      .where(eq(accountInvitations.id, invitation.id))

    return this.accountsService.getAccountById(invitation.accountId)
  }

  async declineInvitation(code: string, actingUserId: string) {
    const codeHash = hashInviteCode(code)

    const invitation = await this.db.db.query.accountInvitations.findFirst({
      where: eq(accountInvitations.codeHash, codeHash),
    })

    if (!invitation) throw new NotFoundException('Invite code not found.')
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        `This invitation has already been ${invitation.status.toLowerCase()}.`,
      )
    }

    const actingUser = await this.db.db.query.users.findFirst({
      where: eq(users.id, actingUserId),
    })

    if (!actingUser) throw new NotFoundException('User not found.')

    if (actingUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException(
        'This invitation was sent to a different email address.',
      )
    }

    await this.db.db
      .update(accountInvitations)
      .set({ status: 'DECLINED', declinedAt: new Date() })
      .where(eq(accountInvitations.id, invitation.id))

    return { message: 'Invitation declined.' }
  }
}
