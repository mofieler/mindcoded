import { randomUUID } from 'node:crypto'
import { getDb, initDb, cleanupExpired } from '../utils/db'
import { sendConfirmationEmail } from '../utils/emailService'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_MAX_LEN = 254
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 3
const RECAPTCHA_MIN_SCORE = 0.5

async function verifyRecaptcha(token: string): Promise<boolean> {
  const config = useRuntimeConfig()
  if (!config.recaptchaSecretKey) return true // skip in dev if key not set
  try {
    const res = await $fetch<{ success: boolean; score: number; 'error-codes'?: string[] }>(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: config.recaptchaSecretKey as string,
          response: token,
        }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )
    return res.success && res.score >= RECAPTCHA_MIN_SCORE
  } catch {
    return false
  }
}

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
  const { email: rawEmail, locale = 'de', website = '', recaptchaToken = '' } = body || {}

  // Honeypot: silently succeed without sending any email
  if (website) {
    return { success: true }
  }

  const email = (rawEmail || '').trim().toLowerCase()

  if (!email || email.length > EMAIL_MAX_LEN || !EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email address.' })
  }

  const humanVerified = await verifyRecaptcha(recaptchaToken)
  if (!humanVerified) {
    throw createError({ statusCode: 400, message: 'reCAPTCHA verification failed. Please try again.' })
  }

  await initDb()

  // Use direct connection IP first; fall back to x-forwarded-for only as secondary key
  const directIp = getRequestIP(event, { xForwardedFor: false })
  const forwardedIp = getRequestIP(event, { xForwardedFor: true })
  const ip = directIp || forwardedIp || 'unknown'
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

  // Fire-and-forget: clean up stale DB rows without blocking response
  cleanupExpired().catch(() => {})

  return { success: true }
})
