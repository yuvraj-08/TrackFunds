import { Controller, Get, Version } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { UsersService } from './users.service.js'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Version('1')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users.' })
  listUsers() {
    return this.usersService.listUsers()
  }
}
