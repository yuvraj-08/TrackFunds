import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Version } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '../auth/current-user.decorator.js'
import type { AuthenticatedUser } from '../auth/auth.types.js'
import { CreateTransactionDto } from './dto/create-transaction.dto.js'
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto.js'
import { UpdateTransactionDto } from './dto/update-transaction.dto.js'
import { TransactionsService } from './transactions.service.js'

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('accounts/:accountId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a transaction for an account.' })
  createTransaction(
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateTransactionDto,
  ) {
    return this.transactionsService.createTransaction(accountId, user.id, body)
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List transactions for an account.' })
  listTransactions(
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.transactionsService.listTransactions(accountId, user.id, query)
  }

  @Get(':transactionId')
  @Version('1')
  @ApiOperation({ summary: 'Get a single transaction for an account.' })
  getTransaction(
    @Param('accountId') accountId: string,
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.getTransaction(accountId, transactionId, user.id)
  }

  @Patch(':transactionId')
  @Version('1')
  @ApiOperation({ summary: 'Update a transaction for an account.' })
  updateTransaction(
    @Param('accountId') accountId: string,
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(accountId, transactionId, user.id, body)
  }

  @Delete(':transactionId')
  @Version('1')
  @ApiOperation({ summary: 'Delete a transaction from an account.' })
  deleteTransaction(
    @Param('accountId') accountId: string,
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.deleteTransaction(accountId, transactionId, user.id)
  }
}
