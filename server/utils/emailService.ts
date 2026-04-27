import { Resend } from 'resend'
import { confirmationEmailHtml, successEmailHtml, adminNotificationHtml, directContactAdminHtml, directContactReceiptHtml } from './emailTemplates'

function getClients() {
  const config = useRuntimeConfig()
  return {
    resend: new Resend(config.resendApiKey),
    from: `mindcoded <${config.resendFromEmail}>`,
    adminEmail: config.adminEmail as string,
  }
}

export async function sendConfirmationEmail(email: string, confirmUrl: string, locale: 'de' | 'en') {
  const { resend, from } = getClients()
  const subject = locale === 'de'
    ? 'Bitte bestätige deine Email – mindcoded'
    : 'Please confirm your email – mindcoded'

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject,
    html: confirmationEmailHtml(confirmUrl, locale),
  })

  if (error) {
    throw createError({ statusCode: 502, message: 'Failed to send confirmation email.' })
  }
}

export async function sendSuccessEmail(email: string, locale: 'de' | 'en') {
  const { resend, from, adminEmail } = getClients()
  const subject = locale === 'de' ? 'Anfrage erhalten – mindcoded' : 'Request received – mindcoded'

  const [userResult, adminResult] = await Promise.all([
    resend.emails.send({
      from,
      to: email,
      subject,
      html: successEmailHtml(email, locale),
    }),
    resend.emails.send({
      from,
      to: adminEmail,
      subject: `Neue Kontaktanfrage: ${email}`,
      html: adminNotificationHtml(email, locale),
    }),
  ])

  if (userResult.error || adminResult.error) {
    throw createError({ statusCode: 502, message: 'Failed to send email notification.' })
  }
}

export async function sendDirectContactEmail(name: string, email: string, subject: string, message: string, locale: 'de' | 'en') {
  const { resend, from, adminEmail } = getClients()

  const [receiptResult, adminResult] = await Promise.all([
    resend.emails.send({
      from,
      to: email,
      subject: locale === 'de' ? 'Nachricht erhalten – mindcoded' : 'Message received – mindcoded',
      html: directContactReceiptHtml(name, locale),
    }),
    resend.emails.send({
      from,
      to: adminEmail,
      subject: `[mindcoded] ${subject}`,
      html: directContactAdminHtml(name, email, subject, message),
      replyTo: email,
    }),
  ])

  if (receiptResult.error || adminResult.error) {
    throw createError({ statusCode: 502, message: 'Failed to send email. Please try again.' })
  }
}
