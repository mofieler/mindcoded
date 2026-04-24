import { randomUUID } from 'node:crypto'
import { getDb, initDb } from '../utils/db'
import { sendConfirmationEmail } from '../utils/emailService'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 3

async function checkRateLimit(key: string): Promise<boolean> {
  const db = getDb()
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS

  const { rows } = await db.query(
    'SELECT requests FROM rate_limits WHERE key = $1',
    [key]
  )

  const requests: number[] = rows.length
    ? (rows[0].requests as number[]).filter((t: number) => t > windowStart)
    : []

  if (requests.length >= RATE_LIMIT_MAX) return false

  requests.push(now)
  await db.query(
    `INSERT INTO rate_limits (key, requests, last_request)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET requests = $2, last_request = $3`,
    [key, requests, now]
  )
  return true
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, locale = 'de' } = body || {}

  if (!email || !EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email address.' })
  }

  await initDb()

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const ipKey = `ip_${ip.replace(/[.:]/g, '_')}`
  const emailKey = `email_${email.replace(/[@.]/g, '_')}`

  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(ipKey),
    checkRateLimit(emailKey),
  ])

  if (!ipOk || !emailOk) {
    throw createError({ statusCode: 429, message: 'Too many requests. Please try again later.' })
  }

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await getDb().query(
    `INSERT INTO pending_confirmations (token, email, locale, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [token, email, locale, expiresAt]
  )

  const config = useRuntimeConfig()
  const confirmUrl = `${config.siteUrl}/api/confirm-contact?token=${token}`

  await sendConfirmationEmail(email, confirmUrl, locale as 'de' | 'en')

  return { success: true }
})
