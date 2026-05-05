import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'

import {
  invitationAcceptedTemplate,
  invitationTemplate,
  passwordChangedTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from './email-templates.js'

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

  async sendWelcomeEmail(input: { to: string; displayName: string }) {
    const from = process.env.RESEND_FROM ?? 'TrackFunds <no-reply@yuvrajcodes.site>'
    const resend = this.getClient()

    if (!resend) {
      this.logger.warn(`Resend not configured. Welcome email not sent for ${input.to}.`)
      return { mode: 'log-only' as const }
    }

    const { subject, html, text } = welcomeTemplate({ displayName: input.displayName })
    await resend.emails.send({ from, to: input.to, subject, html, text })

    return { mode: 'resend' as const }
  }

  async sendPasswordChangedEmail(input: { to: string; displayName: string; changedAt: Date }) {
    const from = process.env.RESEND_FROM ?? 'TrackFunds <no-reply@yuvrajcodes.site>'
    const resend = this.getClient()

    if (!resend) {
      this.logger.warn(`Resend not configured. Password changed email not sent for ${input.to}.`)
      return { mode: 'log-only' as const }
    }

    const { subject, html, text } = passwordChangedTemplate({
      displayName: input.displayName,
      changedAt: input.changedAt,
    })
    await resend.emails.send({ from, to: input.to, subject, html, text })

    return { mode: 'resend' as const }
  }

  async sendInvitationAcceptedEmail(input: {
    to: string
    inviterName: string
    joinerName: string
    accountName: string
  }) {
    const from = process.env.RESEND_FROM ?? 'TrackFunds <no-reply@yuvrajcodes.site>'
    const resend = this.getClient()

    if (!resend) {
      this.logger.warn(`Resend not configured. Invitation accepted email not sent for ${input.to}.`)
      return { mode: 'log-only' as const }
    }

    const { subject, html, text } = invitationAcceptedTemplate({
      inviterName: input.inviterName,
      joinerName: input.joinerName,
      accountName: input.accountName,
    })
    await resend.emails.send({ from, to: input.to, subject, html, text })

    return { mode: 'resend' as const }
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

    const { subject, html, text } = passwordResetTemplate({
      displayName: input.displayName,
      resetUrl,
      expiresAt: input.expiresAt,
    })

    await resend.emails.send({ from, to: input.to, subject, html, text })

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

    const { subject, html, text } = invitationTemplate({
      inviterName: input.inviterName,
      accountName: input.accountName,
      code: input.code,
      expiresAt: input.expiresAt,
    })

    await resend.emails.send({ from, to: input.to, subject, html, text })

    return { mode: 'resend' as const, code: input.code }
  }
}
