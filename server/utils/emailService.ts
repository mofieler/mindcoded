import { Resend } from 'resend'
import { confirmationEmailHtml, successEmailHtml, adminNotificationHtml } from './emailTemplates'

function getResend() {
  const config = useRuntimeConfig()
  return new Resend(config.resendApiKey)
}

export async function sendConfirmationEmail(email: string, confirmUrl: string, locale: 'de' | 'en') {
  const resend = getResend()
  const subject = locale === 'de'
    ? 'Bitte bestätige deine Email – mindcoded'
    : 'Please confirm your email – mindcoded'

  const { error } = await resend.emails.send({
    from: 'mindcoded <noreply@mindcoded.studio>',
    to: email,
    subject,
    html: confirmationEmailHtml(confirmUrl, locale),
  })

  if (error) {
    throw createError({ statusCode: 502, message: 'Failed to send confirmation email.' })
  }
}

export async function sendSuccessEmail(email: string, locale: 'de' | 'en') {
  const resend = getResend()
  const config = useRuntimeConfig()
  const subject = locale === 'de' ? 'Anfrage erhalten – mindcoded' : 'Request received – mindcoded'

  const [userResult, adminResult] = await Promise.all([
    resend.emails.send({
      from: 'mindcoded <noreply@mindcoded.studio>',
      to: email,
      subject,
      html: successEmailHtml(email, locale),
    }),
    resend.emails.send({
      from: 'mindcoded <noreply@mindcoded.studio>',
      to: config.adminEmail as string,
      subject: `Neue Kontaktanfrage: ${email}`,
      html: adminNotificationHtml(email, locale),
    }),
  ])

  if (userResult.error || adminResult.error) {
    throw createError({ statusCode: 502, message: 'Failed to send email notification.' })
  }
}
