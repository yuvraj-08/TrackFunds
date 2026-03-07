import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

import { DatabaseModule } from '../database/database.module.js'
import { MailerModule } from '../mailer/mailer.module.js'
import { UsersModule } from '../users/users.module.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'

@Module({
  imports: [
    DatabaseModule,
    MailerModule,
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
