/**
 * Quick smoke test for Resend email delivery.
 * Prerequisites: npm install -D tsx dotenv
 * Usage:        npx tsx scripts/test-mail.ts
 */

import { Resend } from 'resend'
import { config as loadEnv } from 'dotenv'

loadEnv()

const apiKey = process.env.RESEND_API_KEY ?? ''
const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@mindcoded.studio'
const adminEmail = process.env.ADMIN_EMAIL ?? 'moritz@mindcoded.studio'

if (!apiKey || apiKey === 're_xxxxxxxxxxxxxxxxxxxxxx') {
  console.error('Error: Set a valid RESEND_API_KEY in your .env file.')
  process.exit(1)
}

const resend = new Resend(apiKey)

const { data, error } = await resend.emails.send({
  from: `mindcoded <${fromEmail}>`,
  to: adminEmail,
  subject: '[mindcoded] Test Email ✓',
  html: '<p>This is a test email from <strong>mindcoded.studio</strong>. If you receive this, Resend is configured correctly.</p>',
})

if (error) {
  console.error('Failed:', error)
  process.exit(1)
}

console.log(`Sent successfully — ID: ${data?.id}`)
console.log(`  from: mindcoded <${fromEmail}>`)
console.log(`  to:   ${adminEmail}`)
