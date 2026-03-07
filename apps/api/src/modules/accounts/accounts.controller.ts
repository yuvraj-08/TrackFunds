import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Version } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '../auth/current-user.decorator.js'
import type { AuthenticatedUser } from '../auth/auth.types.js'
import { AccountsService } from './accounts.service.js'
import { AddParticipantDto } from './dto/add-participant.dto.js'
import { CreateAccountDto } from './dto/create-account.dto.js'
import { ListAccountsQueryDto } from './dto/list-accounts-query.dto.js'
import { UpdateAccountDto } from './dto/update-account.dto.js'
import { UpdateParticipantDto } from './dto/update-participant.dto.js'

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create an account and auto-add its creator as manager participant.' })
  createAccount(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAccountDto) {
    return this.accountsService.createAccount(user.id, body)
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all accounts with owners and participants.' })
  listAccounts(@CurrentUser() user: AuthenticatedUser, @Query() query: ListAccountsQueryDto) {
    return this.accountsService.listAccounts(user.id, query)
  }

  @Get(':accountId')
  @Version('1')
  @ApiOperation({ summary: 'Get one account with owner and participants.' })
  async getAccount(@Param('accountId') accountId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.accountsService.assertCanViewAccount(accountId, user.id)
    return this.accountsService.getAccountById(accountId)
  }

  @Patch(':accountId')
  @Version('1')
  @ApiOperation({ summary: 'Update account details.' })
  updateAccount(
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount(accountId, user.id, body)
  }

  @Delete(':accountId')
  @Version('1')
  @ApiOperation({ summary: 'Delete an account and all of its related ledger data.' })
  deleteAccount(@Param('accountId') accountId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.deleteAccount(accountId, user.id)
  }

  @Post(':accountId/participants')
  @Version('1')
  @ApiOperation({ summary: 'Add a participant to an account.' })
  addParticipant(
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AddParticipantDto,
  ) {
    return this.accountsService.addParticipant(accountId, user.id, body)
  }

  @Get(':accountId/participants')
  @Version('1')
  @ApiOperation({ summary: 'List account participants.' })
  listParticipants(@Param('accountId') accountId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.listParticipants(accountId, user.id)
  }

  @Patch(':accountId/participants/:participantId')
  @Version('1')
  @ApiOperation({ summary: 'Update participant permissions for an account.' })
  updateParticipant(
    @Param('accountId') accountId: string,
    @Param('participantId') participantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateParticipantDto,
  ) {
    return this.accountsService.updateParticipant(accountId, participantId, user.id, body)
  }

  @Delete(':accountId/participants/:participantId')
  @Version('1')
  @ApiOperation({ summary: 'Remove a participant from an account.' })
  removeParticipant(
    @Param('accountId') accountId: string,
    @Param('participantId') participantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accountsService.removeParticipant(accountId, participantId, user.id)
  }

  @Get(':accountId/ownership')
  @Version('1')
  @ApiOperation({ summary: 'Get current ownership summary derived from transactions.' })
  getOwnership(@Param('accountId') accountId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.getOwnershipSummary(accountId, user.id)
  }

  @Get(':accountId/debts')
  @Version('1')
  @ApiOperation({ summary: 'Get derived debt summary from withdrawal history.' })
  getDebts(@Param('accountId') accountId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.getDebtSummary(accountId, user.id)
  }
}
