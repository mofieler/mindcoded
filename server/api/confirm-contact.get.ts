import { getDb, initDb } from '../utils/db'
import { sendSuccessEmail } from '../utils/emailService'

export default defineEventHandler(async (event) => {
  const { token } = getQuery(event)

  if (!token || typeof token !== 'string') {
    throw createError({ statusCode: 400, message: 'Missing token.' })
  }

  await initDb()
  const db = getDb()

  const { rows } = await db.query(
    'SELECT * FROM pending_confirmations WHERE token = $1',
    [token]
  )

  if (!rows.length) {
    throw createError({ statusCode: 404, message: 'Invalid or expired confirmation link.' })
  }

  const row = rows[0]

  if (row.confirmed) {
    return sendRedirect(event, '/?confirmed=already', 302)
  }

  if (new Date(row.expires_at) < new Date()) {
    throw createError({ statusCode: 410, message: 'Confirmation link has expired.' })
  }

  await db.query(
    'UPDATE pending_confirmations SET confirmed = TRUE, confirmed_at = NOW() WHERE token = $1',
    [token]
  )

  await sendSuccessEmail(row.email, row.locale as 'de' | 'en')

  return sendRedirect(event, '/?confirmed=true', 302)
})
