import { Injectable, Logger } from '@nestjs/common'
import nodemailer, { type TransportOptions } from 'nodemailer'

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)

  isSmtpConfigured() {
    return Boolean(
      process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS,
    )
  }

  async sendPasswordResetEmail(input: {
    to: string
    displayName: string
    resetToken: string
    expiresAt: Date
  }) {
    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000'
    const resetUrl = `${appUrl.replace(/\/$/u, '')}/reset-password?token=${encodeURIComponent(input.resetToken)}`
    const from = process.env.SMTP_FROM ?? 'no-reply@trackfunds.local'
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const secure = process.env.SMTP_SECURE === 'true'

    if (!host || !port || !user || !pass) {
      this.logger.warn(`SMTP is not configured. Password reset email not sent for ${input.to}.`)

      return {
        mode: 'log-only' as const,
        resetUrl,
      }
    }

    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      family: 4,
    } as TransportOptions)

    await transport.sendMail({
      from,
      to: input.to,
      subject: 'TrackFunds password reset',
      text: [
        `Hi ${input.displayName},`,
        '',
        'A password reset was requested for your TrackFunds account.',
        `Reset your password here: ${resetUrl}`,
        `This link expires at ${input.expiresAt.toISOString()}.`,
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
    })

    return {
      mode: 'smtp' as const,
      resetUrl,
    }
  }

  async sendInvitationEmail(input: {
    to: string
    inviterName: string
    accountName: string
    code: string
    expiresAt: Date
  }) {
    const from = process.env.SMTP_FROM ?? 'no-reply@trackfunds.local'
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const secure = process.env.SMTP_SECURE === 'true'

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        `SMTP not configured. Invite email not sent to ${input.to}. Code: ${input.code}`,
      )
      return { mode: 'log-only' as const, code: input.code }
    }

    const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass }, family: 4 } as TransportOptions)

    await transport.sendMail({
      from,
      to: input.to,
      subject: `${input.inviterName} invited you to "${input.accountName}" on TrackFunds`,
      text: [
        `Hi,`,
        '',
        `${input.inviterName} has invited you to join "${input.accountName}" on TrackFunds.`,
        '',
        `Your invite code: ${input.code}`,
        '',
        'To join:',
        '  1. Open TrackFunds',
        '  2. Go to Accounts → Redeem invite',
        `  3. Enter the code: ${input.code}`,
        '',
        `This invitation expires on ${input.expiresAt.toDateString()}.`,
        '',
        'If you were not expecting this, you can safely ignore this email.',
      ].join('\n'),
    })

    return { mode: 'smtp' as const, code: input.code }
  }
}
