import { Injectable } from '@nestjs/common'

import { DatabaseService } from '../database/database.service.js'

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getHealth() {
    await this.databaseService.ping()

    return {
      status: 'ok',
      service: 'trackfunds-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }
  }
}
