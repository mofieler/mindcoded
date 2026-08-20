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

/**
 * Resend reports delivery problems in the `error` field rather than throwing, so
 * without logging it here a rejected send is completely invisible — which is
 * exactly why "no mail arrives" was undiagnosable before.
 */
function logSendError(label: string, error: unknown) {
  if (!error) return
  console.error(`[email] ${label} failed:`, error)
}

export async function sendConfirmationEmail(email: string, confirmUrl: string, locale: 'de' | 'en') {
  const { resend, from } = getClients()
  const subject = locale === 'de'
    ? 'Bitte bestätige deine E-Mail-Adresse'
    : 'Please confirm your email address'

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject,
    html: confirmationEmailHtml(confirmUrl, locale),
  })

  if (error) {
    logSendError('confirmation email', error)
    throw createError({ statusCode: 502, message: 'Failed to send confirmation email.' })
  }
}

export async function sendSuccessEmail(email: string, locale: 'de' | 'en') {
  const { resend, from, adminEmail } = getClients()
  const subject = locale === 'de' ? 'Anfrage erhalten' : 'Request received'

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

  logSendError('opt-in receipt', userResult.error)
  logSendError('opt-in admin notification', adminResult.error)

  if (userResult.error || adminResult.error) {
    throw createError({ statusCode: 502, message: 'Failed to send email notification.' })
  }
}

export async function sendDirectContactEmail(name: string, email: string, subject: string, message: string, locale: 'de' | 'en') {
  const { resend, from, adminEmail } = getClients()

  // The admin notification is the one that must not get lost — it carries the
  // visitor's actual message. The receipt back to the visitor is a courtesy, so
  // a bounce there (typo'd address, full mailbox) must not throw away a message
  // that already reached the inbox.
  const [adminResult, receiptResult] = await Promise.all([
    resend.emails.send({
      from,
      to: adminEmail,
      subject: `[mindcoded] ${subject}`,
      html: directContactAdminHtml(name, email, subject, message),
      replyTo: email,
    }),
    resend.emails.send({
      from,
      to: email,
      subject: locale === 'de' ? 'Nachricht erhalten' : 'Message received',
      html: directContactReceiptHtml(name, locale),
    }),
  ])

  logSendError('contact admin notification', adminResult.error)
  logSendError('contact receipt', receiptResult.error)

  if (adminResult.error) {
    throw createError({ statusCode: 502, message: 'Failed to send email. Please try again.' })
  }
}
