import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm'

import { accountParticipants, accounts, transactions, users } from '@trackfunds/database'

import { DatabaseService } from '../database/database.service.js'
import { AddParticipantDto } from './dto/add-participant.dto.js'
import { CreateAccountDto } from './dto/create-account.dto.js'
import { ListAccountsQueryDto } from './dto/list-accounts-query.dto.js'
import { UpdateAccountDto } from './dto/update-account.dto.js'
import { UpdateParticipantDto } from './dto/update-participant.dto.js'

@Injectable()
export class AccountsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createAccount(ownerUserId: string, input: CreateAccountDto) {
    await this.assertUserExists(ownerUserId)

    const [account] = await this.databaseService.db
      .insert(accounts)
      .values({
        ...input,
        ownerUserId,
        currencyCode: input.currencyCode ?? 'INR',
      })
      .returning()

    if (!account) {
      throw new BadRequestException('Account could not be created.')
    }

    await this.databaseService.db.insert(accountParticipants).values({
      accountId: account.id,
      userId: ownerUserId,
      canView: true,
      canAddTransactions: true,
      canEditTransactions: true,
      canDeleteTransactions: true,
      canManageParticipants: true,
    })

    return this.getAccountById(account.id)
  }

  async listAccounts(actingUserId: string, query: ListAccountsQueryDto) {
    const visibleParticipations = await this.databaseService.db.query.accountParticipants.findMany({
      where: and(
        eq(accountParticipants.userId, actingUserId),
        eq(accountParticipants.canView, true),
      ),
      columns: {
        accountId: true,
      },
    })

    const accountIds = visibleParticipations.map((participation) => participation.accountId)

    if (accountIds.length === 0) {
      return []
    }

    const limit = query.limit ?? 20
    const offset = query.offset ?? 0

    return this.databaseService.db.query.accounts.findMany({
      where: and(
        inArray(accounts.id, accountIds),
        query.search ? ilike(accounts.name, `%${query.search}%`) : undefined,
      ),
      with: {
        owner: true,
        participants: {
          with: {
            user: true,
          },
        },
      },
      orderBy: desc(accounts.createdAt),
      limit,
      offset,
    })
  }

  async getAccountById(accountId: string) {
    const account = await this.databaseService.db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
      with: {
        owner: true,
        participants: {
          with: {
            user: true,
          },
          orderBy: asc(accountParticipants.createdAt),
        },
      },
    })

    if (!account) {
      throw new NotFoundException(`Account ${accountId} was not found.`)
    }

    return account
  }

  async addParticipant(accountId: string, actingUserId: string, input: AddParticipantDto) {
    await this.getAccountById(accountId)
    await this.assertCanManageParticipants(accountId, actingUserId)
    await this.assertUserExists(input.userId)
    this.assertParticipantPermissionState(input)

    const existingParticipant = await this.databaseService.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.accountId, accountId),
        eq(accountParticipants.userId, input.userId),
      ),
    })

    if (existingParticipant) {
      throw new BadRequestException('User is already a participant in this account.')
    }

    const [participant] = await this.databaseService.db
      .insert(accountParticipants)
      .values({
        accountId,
        userId: input.userId,
        canView: input.canView ?? true,
        canAddTransactions: input.canAddTransactions ?? false,
        canEditTransactions: input.canEditTransactions ?? false,
        canDeleteTransactions: input.canDeleteTransactions ?? false,
        canManageParticipants: input.canManageParticipants ?? false,
      })
      .returning()

    if (!participant) {
      throw new BadRequestException('Participant could not be created.')
    }

    return this.databaseService.db.query.accountParticipants.findFirst({
      where: eq(accountParticipants.id, participant.id),
      with: {
        user: true,
        account: true,
      },
    })
  }

  async listParticipants(accountId: string, actingUserId: string) {
    await this.getAccountById(accountId)
    await this.assertCanViewAccount(accountId, actingUserId)

    return this.databaseService.db.query.accountParticipants.findMany({
      where: eq(accountParticipants.accountId, accountId),
      with: {
        user: true,
      },
      orderBy: asc(accountParticipants.createdAt),
    })
  }

  async updateAccount(accountId: string, actingUserId: string, input: UpdateAccountDto) {
    const account = await this.getAccountById(accountId)
    this.assertIsAccountOwner(account, actingUserId)

    if (
      input.name === undefined &&
      input.institution === undefined &&
      input.currencyCode === undefined
    ) {
      return account
    }

    await this.databaseService.db
      .update(accounts)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId))

    return this.getAccountById(accountId)
  }

  async deleteAccount(accountId: string, actingUserId: string) {
    const account = await this.getAccountById(accountId)
    this.assertIsAccountOwner(account, actingUserId)

    const [deletedAccount] = await this.databaseService.db
      .delete(accounts)
      .where(eq(accounts.id, accountId))
      .returning({
        id: accounts.id,
        name: accounts.name,
      })

    if (!deletedAccount) {
      throw new NotFoundException(`Account ${accountId} was not found.`)
    }

    return {
      message: `Account ${deletedAccount.name} deleted successfully.`,
      accountId: deletedAccount.id,
    }
  }

  async updateParticipant(
    accountId: string,
    participantId: string,
    actingUserId: string,
    input: UpdateParticipantDto,
  ) {
    const account = await this.getAccountById(accountId)
    await this.assertCanManageParticipants(accountId, actingUserId)

    const participant = await this.getParticipantById(accountId, participantId)

    if (participant.userId === account.ownerUserId) {
      throw new BadRequestException('The account owner participant cannot be modified.')
    }

    this.assertParticipantPermissionState(input)

    await this.databaseService.db
      .update(accountParticipants)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(accountParticipants.id, participantId))

    return this.databaseService.db.query.accountParticipants.findFirst({
      where: eq(accountParticipants.id, participantId),
      with: {
        user: true,
        account: true,
      },
    })
  }

  async removeParticipant(accountId: string, participantId: string, actingUserId: string) {
    const account = await this.getAccountById(accountId)
    await this.assertCanManageParticipants(accountId, actingUserId)

    const participant = await this.getParticipantById(accountId, participantId)

    if (participant.userId === account.ownerUserId) {
      throw new BadRequestException('The account owner participant cannot be removed.')
    }

    await this.databaseService.db
      .delete(accountParticipants)
      .where(eq(accountParticipants.id, participantId))

    return {
      message: 'Participant removed successfully.',
      participantId,
    }
  }

  async getOwnershipSummary(accountId: string, actingUserId: string) {
    await this.getAccountById(accountId)
    await this.assertCanViewAccount(accountId, actingUserId)

    return this.databaseService.db
      .select({
        ownerUserId: transactions.ownerUserId,
        displayName: users.displayName,
        amount: sql<string>`coalesce(sum(
          case
            when ${transactions.type} = 'DEPOSIT' then ${transactions.amount}
            else -${transactions.amount}
          end
        ), 0)`,
      })
      .from(transactions)
      .innerJoin(users, eq(users.id, transactions.ownerUserId))
      .where(eq(transactions.accountId, accountId))
      .groupBy(transactions.ownerUserId, users.displayName)
  }

  async getDebtSummary(accountId: string, actingUserId: string) {
    await this.getAccountById(accountId)
    await this.assertCanViewAccount(accountId, actingUserId)

    return this.databaseService.db
      .select({
        ownerUserId: transactions.ownerUserId,
        ownerDisplayName: users.displayName,
        spentByUserId: transactions.spentByUserId,
        amount: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .innerJoin(users, eq(users.id, transactions.ownerUserId))
      .where(
        and(
          eq(transactions.accountId, accountId),
          eq(transactions.type, 'WITHDRAWAL'),
          sql`${transactions.ownerUserId} <> ${transactions.spentByUserId}`,
        ),
      )
      .groupBy(transactions.ownerUserId, users.displayName, transactions.spentByUserId)
  }

  private async assertUserExists(userId: string) {
    const user = await this.databaseService.db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      throw new NotFoundException(`User ${userId} was not found.`)
    }
  }

  async assertCanViewAccount(accountId: string, userId: string) {
    const participant = await this.databaseService.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.accountId, accountId),
        eq(accountParticipants.userId, userId),
      ),
    })

    if (!participant || !participant.canView) {
      throw new BadRequestException(`User ${userId} cannot view account ${accountId}.`)
    }
  }

  async assertCanManageParticipants(accountId: string, userId: string) {
    const participant = await this.databaseService.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.accountId, accountId),
        eq(accountParticipants.userId, userId),
      ),
    })

    if (!participant || !participant.canManageParticipants) {
      throw new BadRequestException(
        `User ${userId} cannot manage participants for account ${accountId}.`,
      )
    }
  }

  async assertCanRecordTransactions(accountId: string, userId: string) {
    const participant = await this.databaseService.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.accountId, accountId),
        eq(accountParticipants.userId, userId),
      ),
    })

    if (!participant || !participant.canAddTransactions) {
      throw new BadRequestException(
        `User ${userId} cannot record transactions for account ${accountId}.`,
      )
    }
  }

  async assertCanEditTransactions(accountId: string, userId: string) {
    const participant = await this.databaseService.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.accountId, accountId),
        eq(accountParticipants.userId, userId),
      ),
    })

    if (!participant || !participant.canEditTransactions) {
      throw new BadRequestException(
        `User ${userId} cannot edit transactions for account ${accountId}.`,
      )
    }
  }

  async assertCanDeleteTransactions(accountId: string, userId: string) {
    const participant = await this.databaseService.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.accountId, accountId),
        eq(accountParticipants.userId, userId),
      ),
    })

    if (!participant || !participant.canDeleteTransactions) {
      throw new BadRequestException(
        `User ${userId} cannot delete transactions for account ${accountId}.`,
      )
    }
  }

  private assertIsAccountOwner(
    account: Awaited<ReturnType<AccountsService['getAccountById']>>,
    userId: string,
  ) {
    if (account.ownerUserId !== userId) {
      throw new BadRequestException(`User ${userId} is not the owner of account ${account.id}.`)
    }
  }

  private async getParticipantById(accountId: string, participantId: string) {
    const participant = await this.databaseService.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.id, participantId),
        eq(accountParticipants.accountId, accountId),
      ),
      with: {
        user: true,
        account: true,
      },
    })

    if (!participant) {
      throw new NotFoundException(`Participant ${participantId} was not found.`)
    }

    return participant
  }

  private assertParticipantPermissionState(
    input: Pick<
      AddParticipantDto | UpdateParticipantDto,
      | 'canView'
      | 'canAddTransactions'
      | 'canEditTransactions'
      | 'canDeleteTransactions'
      | 'canManageParticipants'
    >,
  ) {
    if (
      input.canView === false &&
      (input.canAddTransactions ||
        input.canEditTransactions ||
        input.canDeleteTransactions ||
        input.canManageParticipants)
    ) {
      throw new BadRequestException(
        'A participant cannot have action permissions if account visibility is disabled.',
      )
    }
  }
}
