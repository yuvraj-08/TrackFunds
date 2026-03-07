import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import Joi from 'joi'
import path from 'node:path'

import { AccountsModule } from './accounts/accounts.module.js'
import { AuthModule } from './auth/auth.module.js'
import { AuthGuard } from './auth/auth.guard.js'
import { DatabaseModule } from './database/database.module.js'
import { HealthModule } from './health/health.module.js'
import { TransactionsModule } from './transactions/transactions.module.js'
import { UsersModule } from './users/users.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().port().default(4000),
        API_PREFIX: Joi.string().default('api'),
        APP_BASE_URL: Joi.string().uri().default('http://localhost:3000'),
        CORS_ORIGIN: Joi.string().allow('').default('*'),
        DATABASE_URL: Joi.string()
          .uri({ scheme: ['postgresql', 'postgres'] })
          .required(),
        JWT_SECRET: Joi.string().min(16).required(),
        THROTTLE_TTL: Joi.number().integer().min(1000).default(60000),
        THROTTLE_LIMIT: Joi.number().integer().min(1).default(60),
        SMTP_HOST: Joi.string().hostname().optional(),
        SMTP_PORT: Joi.number().port().optional(),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASS: Joi.string().optional(),
        SMTP_FROM: Joi.string().email().optional(),
        SMTP_SECURE: Joi.boolean().optional(),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [],
      useFactory: () => ({
        throttlers: [
          {
            ttl: Number(process.env.THROTTLE_TTL ?? 60000),
            limit: Number(process.env.THROTTLE_LIMIT ?? 60),
          },
        ],
      }),
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
