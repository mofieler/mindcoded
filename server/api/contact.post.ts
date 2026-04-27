import { getDb, initDb, cleanupExpired } from '../utils/db'
import { sendDirectContactEmail } from '../utils/emailService'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_MAX_LEN = 254
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 5
const RECAPTCHA_MIN_SCORE = 0.5

async function checkRateLimit(key: string): Promise<boolean> {
  const db = getDb()
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS

  const { rows } = await db.query('SELECT requests FROM rate_limits WHERE key = $1', [key])
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

async function verifyRecaptcha(token: string): Promise<boolean> {
  const config = useRuntimeConfig()
  if (!config.recaptchaSecretKey) return true
  try {
    const res = await $fetch<{ success: boolean; score: number }>(
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

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name: rawName, email: rawEmail, subject: rawSubject, message: rawMessage, locale = 'de', website = '', recaptchaToken = '' } = body || {}

  // Honeypot
  if (website) return { success: true }

  const name = (rawName || '').trim()
  const email = (rawEmail || '').trim().toLowerCase()
  const subject = (rawSubject || '').trim()
  const message = (rawMessage || '').trim()

  if (!name || !email || !subject || !message) {
    throw createError({ statusCode: 400, message: 'Please fill in all fields.' })
  }
  if (email.length > EMAIL_MAX_LEN || !EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email address.' })
  }
  if (subject.length > 200) {
    throw createError({ statusCode: 400, message: 'Subject too long.' })
  }
  if (message.length > 5000) {
    throw createError({ statusCode: 400, message: 'Message too long.' })
  }

  const humanVerified = await verifyRecaptcha(recaptchaToken)
  if (!humanVerified) {
    throw createError({ statusCode: 400, message: 'reCAPTCHA verification failed. Please try again.' })
  }

  await initDb()

  const directIp = getRequestIP(event, { xForwardedFor: false })
  const forwardedIp = getRequestIP(event, { xForwardedFor: true })
  const ip = directIp || forwardedIp || 'unknown'

  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(`contact_ip_${ip.replace(/[.:]/g, '_')}`),
    checkRateLimit(`contact_email_${email.replace(/[@.]/g, '_')}`),
  ])

  if (!ipOk || !emailOk) {
    throw createError({ statusCode: 429, message: 'Too many requests. Please try again later.' })
  }

  await sendDirectContactEmail(name, email, subject, message, locale as 'de' | 'en')

  cleanupExpired().catch(() => {})

  return { success: true }
})
