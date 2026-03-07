import { ConflictException, Injectable } from '@nestjs/common'
import { desc } from 'drizzle-orm'

import { users } from '@trackfunds/database'

import { DatabaseService } from '../database/database.service.js'
import { CreateUserDto } from './dto/create-user.dto.js'

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(input: CreateUserDto) {
    try {
      const [user] = await this.databaseService.db.insert(users).values(input).returning()
      return user
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(`A user with email ${input.email} already exists.`)
      }

      throw error
    }
  }

  async listUsers() {
    return this.databaseService.db.query.users.findMany({
      orderBy: desc(users.createdAt),
    })
  }
}
