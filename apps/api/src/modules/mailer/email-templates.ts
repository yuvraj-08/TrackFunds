const BASE = {
  bg: '#f5efe4',
  surface: '#fffaf0',
  accent: '#0f766e',
  accentDark: '#115e59',
  text: '#1d1b19',
  muted: '#6c6357',
  border: 'rgba(29,27,25,0.12)',
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

function shell(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BASE.bg};font-family:${BASE.font};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BASE.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / wordmark -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:${BASE.accent};">TrackFunds</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${BASE.surface};border-radius:12px;border:1px solid ${BASE.border};padding:40px 36px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:${BASE.muted};line-height:1.6;">
                You received this email because an action was taken on your TrackFunds account.<br/>
                If this wasn't you, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function button(label: string, href: string) {
  return `<a href="${href}" target="_blank"
    style="display:inline-block;margin-top:28px;padding:13px 28px;background:${BASE.accent};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.1px;">
    ${label}
  </a>`
}

function heading(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BASE.text};letter-spacing:-0.3px;">${text}</h1>`
}

function p(text: string) {
  return `<p style="margin:0 0 12px;font-size:15px;color:${BASE.muted};line-height:1.65;">${text}</p>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid ${BASE.border};margin:28px 0;" />`
}

function codeBlock(code: string) {
  return `<div style="margin:20px 0;padding:18px 24px;background:${BASE.bg};border-radius:8px;border:1px dashed ${BASE.accentDark};text-align:center;">
    <span style="font-size:28px;font-weight:700;letter-spacing:6px;color:${BASE.accent};font-family:monospace;">${code}</span>
  </div>`
}

function smallNote(text: string) {
  return `<p style="margin:16px 0 0;font-size:13px;color:${BASE.muted};line-height:1.6;">${text}</p>`
}

export function welcomeTemplate(input: { displayName: string }) {
  const body = `
    ${heading(`Welcome to TrackFunds, ${input.displayName}!`)}
    ${p("We're glad you're here. TrackFunds helps you track shared expenses, split costs, and stay on top of your finances — together.")}
    ${p("Here's what you can do to get started:")}
    <ul style="margin:0 0 12px;padding-left:20px;font-size:15px;color:${BASE.muted};line-height:1.9;">
      <li>Create your first <strong>account</strong> to track expenses</li>
      <li>Invite <strong>friends or family</strong> to collaborate</li>
      <li>Log <strong>transactions</strong> and see who owes what</li>
    </ul>
    ${divider()}
    ${smallNote("If you didn't create this account, please contact us immediately.")}
  `

  return {
    subject: `Welcome to TrackFunds, ${input.displayName}!`,
    html: shell(`Welcome to TrackFunds`, body),
    text: [
      `Hi ${input.displayName},`,
      '',
      'Welcome to TrackFunds! Track shared expenses, split costs, and stay on top of your finances.',
      '',
      "Get started: create an account, invite collaborators, and log your first transaction.",
    ].join('\n'),
  }
}

export function passwordChangedTemplate(input: { displayName: string; changedAt: Date }) {
  const changedAt = input.changedAt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const body = `
    ${heading('Your password was changed')}
    ${p(`Hi ${input.displayName},`)}
    ${p(`Your TrackFunds password was successfully changed on <strong>${changedAt}</strong>.`)}
    ${p("If you made this change, you're all set — no further action is needed.")}
    ${divider()}
    ${smallNote("If you didn't make this change, your account may be compromised. Reset your password immediately or contact support.")}
  `

  return {
    subject: 'Your TrackFunds password was changed',
    html: shell('Password changed', body),
    text: [
      `Hi ${input.displayName},`,
      '',
      `Your TrackFunds password was changed on ${changedAt}.`,
      '',
      "If this wasn't you, reset your password immediately.",
    ].join('\n'),
  }
}

export function invitationAcceptedTemplate(input: {
  inviterName: string
  joinerName: string
  accountName: string
}) {
  const body = `
    ${heading('Someone joined your account')}
    ${p(`Hi ${input.inviterName},`)}
    ${p(`<strong>${input.joinerName}</strong> has accepted your invitation and joined <strong>"${input.accountName}"</strong> on TrackFunds.`)}
    ${p("They now have access to the account based on the permissions you set when sending the invite.")}
    ${divider()}
    ${smallNote("You can manage participant permissions anytime from the account settings.")}
  `

  return {
    subject: `${input.joinerName} joined "${input.accountName}" on TrackFunds`,
    html: shell(`${input.joinerName} joined your account`, body),
    text: [
      `Hi ${input.inviterName},`,
      '',
      `${input.joinerName} has accepted your invitation and joined "${input.accountName}" on TrackFunds.`,
    ].join('\n'),
  }
}

export function passwordResetTemplate(input: {
  displayName: string
  resetUrl: string
  expiresAt: Date
}) {
  const expiry = input.expiresAt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const body = `
    ${heading('Reset your password')}
    ${p(`Hi ${input.displayName},`)}
    ${p("We received a request to reset the password for your TrackFunds account. Click the button below to choose a new one.")}
    <div style="text-align:center;">
      ${button('Reset Password', input.resetUrl)}
    </div>
    ${divider()}
    ${smallNote(`This link expires on <strong>${expiry}</strong>. If you didn't request a password reset, no action is needed — your account is safe.`)}
  `

  return {
    subject: 'Reset your TrackFunds password',
    html: shell('Reset your TrackFunds password', body),
    text: [
      `Hi ${input.displayName},`,
      '',
      'Reset your TrackFunds password here:',
      input.resetUrl,
      '',
      `Expires: ${expiry}`,
      '',
      "If you didn't request this, ignore this email.",
    ].join('\n'),
  }
}

export function invitationTemplate(input: {
  inviterName: string
  accountName: string
  code: string
  expiresAt: Date
}) {
  const expiry = input.expiresAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const body = `
    ${heading(`You've been invited`)}
    ${p(`<strong>${input.inviterName}</strong> has invited you to join <strong>"${input.accountName}"</strong> on TrackFunds.`)}
    ${p('Use the code below to accept the invitation:')}
    ${codeBlock(input.code)}
    ${p('To redeem:')}
    <ol style="margin:0 0 12px;padding-left:20px;font-size:15px;color:${BASE.muted};line-height:1.8;">
      <li>Open TrackFunds</li>
      <li>Go to <strong>Accounts → Redeem invite</strong></li>
      <li>Enter the code above</li>
    </ol>
    ${divider()}
    ${smallNote(`This invitation expires on <strong>${expiry}</strong>. If you weren't expecting this, you can safely ignore it.`)}
  `

  return {
    subject: `${input.inviterName} invited you to "${input.accountName}" on TrackFunds`,
    html: shell(`You're invited to ${input.accountName}`, body),
    text: [
      `Hi,`,
      '',
      `${input.inviterName} invited you to join "${input.accountName}" on TrackFunds.`,
      '',
      `Your invite code: ${input.code}`,
      '',
      'To join: open TrackFunds → Accounts → Redeem invite → enter the code.',
      '',
      `Expires: ${expiry}`,
    ].join('\n'),
  }
}
