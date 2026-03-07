import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema.js'

const connectionString = process.env.DATABASE_URL

export type DbClient = NodePgDatabase<typeof schema>

export function createDatabasePool(connection = connectionString) {
  if (!connection) {
    throw new Error('DATABASE_URL is required to create a database connection.')
  }

  return new Pool({
    connectionString: connection,
  })
}

export function createDb(connection = connectionString): DbClient {
  const pool = createDatabasePool(connection)

  return drizzle(pool, { schema })
}

export type Database = DbClient
