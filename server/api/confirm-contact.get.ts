import { getDb, initDb } from '../utils/db'
import { sendSuccessEmail } from '../utils/emailService'

export default defineEventHandler(async (event) => {
  const { token } = getQuery(event)

  if (!token || typeof token !== 'string') {
    return sendRedirect(event, '/confirm?status=invalid&locale=de', 302)
  }

  await initDb()
  const db = getDb()

  const { rows } = await db.query(
    'SELECT * FROM pending_confirmations WHERE token = $1',
    [token]
  )

  if (!rows.length) {
    return sendRedirect(event, '/confirm?status=invalid&locale=de', 302)
  }

  const row = rows[0]

  const locale = row.locale || 'de'

  if (row.confirmed) {
    return sendRedirect(event, `/confirm?status=already&locale=${locale}`, 302)
  }

  if (new Date(row.expires_at) < new Date()) {
    return sendRedirect(event, `/confirm?status=expired&locale=${locale}`, 302)
  }

  await db.query(
    'UPDATE pending_confirmations SET confirmed = TRUE, confirmed_at = NOW() WHERE token = $1',
    [token]
  )

  await sendSuccessEmail(row.email, row.locale as 'de' | 'en')

  return sendRedirect(event, `/confirm?status=success&locale=${locale}`, 302)
})
