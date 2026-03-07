import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { sql } from 'drizzle-orm'

import { createDb } from '@trackfunds/database'

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly db = createDb(process.env.DATABASE_URL)

  async ping() {
    await this.db.execute(sql`select 1`)
  }

  async onModuleDestroy() {
    return
  }
}
