import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)

  private getClient() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return null
    return new Resend(apiKey)
  }

  isResendConfigured() {
    return Boolean(process.env.RESEND_API_KEY)
  }

  async sendPasswordResetEmail(input: {
    to: string
    displayName: string
    resetToken: string
    expiresAt: Date
  }) {
    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000'
    const resetUrl = `${appUrl.replace(/\/$/u, '')}/reset-password?token=${encodeURIComponent(input.resetToken)}`
    const from = process.env.RESEND_FROM ?? 'TrackFunds <no-reply@yuvrajcodes.site>'
    const resend = this.getClient()

    if (!resend) {
      this.logger.warn(`Resend not configured. Password reset email not sent for ${input.to}.`)
      return { mode: 'log-only' as const, resetUrl }
    }

    await resend.emails.send({
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

    return { mode: 'resend' as const, resetUrl }
  }

  async sendInvitationEmail(input: {
    to: string
    inviterName: string
    accountName: string
    code: string
    expiresAt: Date
  }) {
    const from = process.env.RESEND_FROM ?? 'TrackFunds <no-reply@yuvrajcodes.site>'
    const resend = this.getClient()

    if (!resend) {
      this.logger.warn(
        `Resend not configured. Invite email not sent to ${input.to}. Code: ${input.code}`,
      )
      return { mode: 'log-only' as const, code: input.code }
    }

    await resend.emails.send({
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

    return { mode: 'resend' as const, code: input.code }
  }
}
