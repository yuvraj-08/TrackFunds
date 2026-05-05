import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { and, eq, isNull } from 'drizzle-orm'

import { passwordResetTokens, refreshTokens, users } from '@trackfunds/database'

import { DatabaseService } from '../database/database.service.js'
import { MailerService } from '../mailer/mailer.service.js'
import { UsersService } from '../users/users.service.js'
import {
  generateResetToken,
  generateSessionToken,
  hashPassword,
  hashResetToken,
  hashSessionToken,
  verifyPassword,
} from './crypto.js'
import { ForgotPasswordDto } from './dto/forgot-password.dto.js'
import { LoginDto } from './dto/login.dto.js'
import { LogoutDto } from './dto/logout.dto.js'
import { RefreshTokenDto } from './dto/refresh-token.dto.js'
import { RegisterDto } from './dto/register.dto.js'
import { ResetPasswordDto } from './dto/reset-password.dto.js'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async register(input: RegisterDto) {
    const user = await this.usersService.createUser({
      email: input.email,
      displayName: input.displayName,
      passwordHash: hashPassword(input.password),
    })

    if (!user) {
      throw new UnauthorizedException('User registration failed.')
    }

    this.mailerService.sendWelcomeEmail({ to: user.email, displayName: user.displayName }).catch(
      (err: unknown) => this.logger.error(`Welcome email failed for ${user.email}: ${String(err)}`),
    )

    return this.issueAuthResponse(user.id, user.email, user.displayName)
  }

  async login(input: LoginDto) {
    const user = await this.databaseService.db.query.users.findFirst({
      where: eq(users.email, input.email),
    })

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    if (!verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    return this.issueAuthResponse(user.id, user.email, user.displayName)
  }

  async forgotPassword(input: ForgotPasswordDto) {
    const user = await this.databaseService.db.query.users.findFirst({
      where: eq(users.email, input.email),
      columns: {
        id: true,
        email: true,
        displayName: true,
      },
    })

    const message = 'If an account with that email exists, a password reset token has been issued.'

    if (!user) {
      return { message }
    }

    if (process.env.NODE_ENV === 'production' && !this.mailerService.isResendConfigured()) {
      throw new ServiceUnavailableException('Password reset email delivery is not configured.')
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)
    const resetToken = generateResetToken()

    await this.databaseService.db.transaction(async (tx) => {
      await tx
        .update(passwordResetTokens)
        .set({ consumedAt: now })
        .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.consumedAt)))

      await tx.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: hashResetToken(resetToken),
        expiresAt,
      })
    })

    const mailResult = await this.mailerService.sendPasswordResetEmail({
      to: user.email,
      displayName: user.displayName,
      resetToken,
      expiresAt,
    })

    return {
      message,
      expiresAt: expiresAt.toISOString(),
      delivery: mailResult.mode,
      ...(process.env.NODE_ENV === 'production'
        ? {}
        : {
            resetToken,
            resetUrl: mailResult.resetUrl,
          }),
    }
  }

  async resetPassword(input: ResetPasswordDto) {
    const tokenHash = hashResetToken(input.token)

    const resetToken = await this.databaseService.db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.tokenHash, tokenHash),
      columns: {
        id: true,
        userId: true,
        expiresAt: true,
        consumedAt: true,
      },
    })

    if (!resetToken) {
      throw new BadRequestException('Invalid password reset token.')
    }

    if (resetToken.consumedAt) {
      throw new BadRequestException('Password reset token has already been used.')
    }

    if (resetToken.expiresAt <= new Date()) {
      throw new BadRequestException('Password reset token has expired.')
    }

    const consumedAt = new Date()

    const [updatedUser] = await this.databaseService.db.transaction(async (tx) => {
      const result = await tx
        .update(users)
        .set({
          passwordHash: hashPassword(input.newPassword),
          updatedAt: consumedAt,
        })
        .where(eq(users.id, resetToken.userId))
        .returning({ email: users.email, displayName: users.displayName })

      await tx
        .update(passwordResetTokens)
        .set({ consumedAt })
        .where(
          and(
            eq(passwordResetTokens.userId, resetToken.userId),
            isNull(passwordResetTokens.consumedAt),
          ),
        )
      await tx
        .update(refreshTokens)
        .set({ revokedAt: consumedAt })
        .where(and(eq(refreshTokens.userId, resetToken.userId), isNull(refreshTokens.revokedAt)))

      return result
    })

    if (updatedUser) {
      this.mailerService
        .sendPasswordChangedEmail({
          to: updatedUser.email,
          displayName: updatedUser.displayName,
          changedAt: consumedAt,
        })
        .catch((err: unknown) =>
          this.logger.error(`Password changed email failed for ${updatedUser.email}: ${String(err)}`),
        )
    }

    return {
      message: 'Password reset successful.',
    }
  }

  async getProfile(userId: string) {
    const user = await this.databaseService.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found.')
    }

    return user
  }

  async refresh(input: RefreshTokenDto) {
    const tokenHash = hashSessionToken(input.refreshToken)
    const now = new Date()

    const authResponse = await this.databaseService.db.transaction(async (tx) => {
      const existingToken = await tx.query.refreshTokens.findFirst({
        where: eq(refreshTokens.tokenHash, tokenHash),
        with: {
          user: true,
        },
      })

      if (!existingToken || existingToken.revokedAt || existingToken.expiresAt <= now) {
        throw new UnauthorizedException('Invalid or expired refresh token.')
      }

      const [revokedToken] = await tx
        .update(refreshTokens)
        .set({ revokedAt: now })
        .where(and(eq(refreshTokens.id, existingToken.id), isNull(refreshTokens.revokedAt)))
        .returning({
          id: refreshTokens.id,
        })

      if (!revokedToken) {
        throw new UnauthorizedException('Invalid or expired refresh token.')
      }

      const accessToken = await this.jwtService.signAsync({
        sub: existingToken.user.id,
        email: existingToken.user.email,
      })
      const refreshToken = generateSessionToken()
      const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      await tx.insert(refreshTokens).values({
        userId: existingToken.user.id,
        tokenHash: hashSessionToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
      })

      return {
        accessToken,
        refreshToken,
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
        user: {
          id: existingToken.user.id,
          email: existingToken.user.email,
          displayName: existingToken.user.displayName,
        },
      }
    })

    return authResponse
  }

  async logout(input: LogoutDto) {
    const tokenHash = hashSessionToken(input.refreshToken)

    await this.databaseService.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))

    return {
      message: 'Session revoked successfully.',
    }
  }

  async logoutAll(userId: string) {
    await this.databaseService.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))

    return {
      message: 'All sessions revoked successfully.',
    }
  }

  async verifyToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<{ sub: string; email: string }>(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired token.')
    }
  }

  private async issueAuthResponse(userId: string, email: string, displayName: string) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email,
    })
    const refreshToken = generateSessionToken()
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await this.databaseService.db.insert(refreshTokens).values({
      userId,
      tokenHash: hashSessionToken(refreshToken),
      expiresAt: refreshExpiresAt,
    })

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
      user: {
        id: userId,
        email,
        displayName,
      },
    }
  }
}
