import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'

import { accountParticipants, transactions, users } from '@trackfunds/database'

import { AccountsService } from '../accounts/accounts.service.js'
import { DatabaseService } from '../database/database.service.js'
import { CreateTransactionDto } from './dto/create-transaction.dto.js'
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto.js'
import { UpdateTransactionDto } from './dto/update-transaction.dto.js'

@Injectable()
export class TransactionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly accountsService: AccountsService,
  ) {}

  async createTransaction(accountId: string, actingUserId: string, input: CreateTransactionDto) {
    await this.accountsService.getAccountById(accountId)
    await this.accountsService.assertCanRecordTransactions(accountId, actingUserId)
    await this.accountsService.assertCanViewAccount(accountId, input.ownerUserId)
    await this.accountsService.assertCanViewAccount(accountId, input.spentByUserId)
    this.assertTransactionAmount(input.amount)

    await Promise.all([
      this.assertParticipant(accountId, input.ownerUserId),
      this.assertParticipant(accountId, input.spentByUserId),
    ])

    const [transaction] = await this.databaseService.db
      .insert(transactions)
      .values({
        accountId,
        amount: input.amount,
        type: input.type,
        source: input.source ?? 'MANUAL',
        ownerUserId: input.ownerUserId,
        spentByUserId: input.spentByUserId,
        recordedByUserId: actingUserId,
        note: input.note,
        occurredAt: new Date(input.occurredAt),
      })
      .returning()

    if (!transaction) {
      throw new BadRequestException('Transaction could not be created.')
    }

    return this.databaseService.db.query.transactions.findFirst({
      where: eq(transactions.id, transaction.id),
      with: {
        owner: true,
        spentBy: true,
        recordedBy: true,
        account: true,
      },
    })
  }

  async listTransactions(accountId: string, actingUserId: string, query: ListTransactionsQueryDto) {
    await this.accountsService.getAccountById(accountId)
    await this.accountsService.assertCanViewAccount(accountId, actingUserId)

    const limit = query.limit ?? 20
    const offset = query.offset ?? 0

    return this.databaseService.db.query.transactions.findMany({
      where: and(
        eq(transactions.accountId, accountId),
        query.type ? eq(transactions.type, query.type) : undefined,
        query.ownerUserId ? eq(transactions.ownerUserId, query.ownerUserId) : undefined,
        query.spentByUserId ? eq(transactions.spentByUserId, query.spentByUserId) : undefined,
      ),
      with: {
        owner: true,
        spentBy: true,
        recordedBy: true,
      },
      orderBy: desc(transactions.occurredAt),
      limit,
      offset,
    })
  }

  async getTransaction(accountId: string, transactionId: string, actingUserId: string) {
    await this.accountsService.getAccountById(accountId)
    await this.accountsService.assertCanViewAccount(accountId, actingUserId)

    const transaction = await this.getTransactionById(accountId, transactionId)
    return transaction
  }

  async updateTransaction(
    accountId: string,
    transactionId: string,
    actingUserId: string,
    input: UpdateTransactionDto,
  ) {
    await this.accountsService.getAccountById(accountId)
    await this.accountsService.assertCanEditTransactions(accountId, actingUserId)

    const transaction = await this.getTransactionById(accountId, transactionId)
    const ownerUserId = input.ownerUserId ?? transaction.ownerUserId
    const spentByUserId = input.spentByUserId ?? transaction.spentByUserId
    const amount = input.amount ?? transaction.amount
    this.assertTransactionAmount(amount)
    await this.accountsService.assertCanViewAccount(accountId, ownerUserId)
    await this.accountsService.assertCanViewAccount(accountId, spentByUserId)

    await Promise.all([
      this.assertParticipant(accountId, ownerUserId),
      this.assertParticipant(accountId, spentByUserId),
    ])

    await this.databaseService.db
      .update(transactions)
      .set({
        amount,
        type: input.type,
        source: input.source,
        ownerUserId,
        spentByUserId,
        note: input.note,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))

    return this.getTransactionById(accountId, transactionId)
  }

  async deleteTransaction(accountId: string, transactionId: string, actingUserId: string) {
    await this.accountsService.getAccountById(accountId)
    await this.accountsService.assertCanDeleteTransactions(accountId, actingUserId)
    await this.getTransactionById(accountId, transactionId)

    await this.databaseService.db
      .delete(transactions)
      .where(and(eq(transactions.accountId, accountId), eq(transactions.id, transactionId)))

    return {
      message: 'Transaction deleted successfully.',
      transactionId,
    }
  }

  private async assertParticipant(accountId: string, userId: string) {
    const participant = await this.databaseService.db.query.accountParticipants.findFirst({
      where: and(
        eq(accountParticipants.accountId, accountId),
        eq(accountParticipants.userId, userId),
      ),
    })

    if (!participant) {
      const user = await this.databaseService.db.query.users.findFirst({
        where: eq(users.id, userId),
      })

      if (!user) {
        throw new NotFoundException(`User ${userId} was not found.`)
      }

      throw new BadRequestException(`User ${userId} is not a participant in account ${accountId}.`)
    }
  }

  private async getTransactionById(accountId: string, transactionId: string) {
    const transaction = await this.databaseService.db.query.transactions.findFirst({
      where: and(eq(transactions.accountId, accountId), eq(transactions.id, transactionId)),
      with: {
        owner: true,
        spentBy: true,
        recordedBy: true,
        account: true,
      },
    })

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} was not found.`)
    }

    return transaction
  }

  private assertTransactionAmount(amount: string) {
    if (Number(amount) <= 0) {
      throw new BadRequestException('Transaction amount must be greater than zero.')
    }
  }
}
