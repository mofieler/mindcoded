export function confirmationEmailHtml(confirmUrl: string, locale: 'de' | 'en'): string {
  if (locale === 'de') {
    return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="color-scheme" content="light dark"><title>Bitte bestätige deine Email</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Inter',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;padding:48px;border:1px solid #262626;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">mindcoded</p>
          <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#f5f5f5;line-height:1.2;">Bestätige deine Email-Adresse</h1>
          <p style="margin:0 0 32px;font-size:16px;color:#9ca3af;line-height:1.6;">Du hast eine Kontaktanfrage über mindcoded.de gesendet. Klicke auf den Button, um deine Email-Adresse zu bestätigen und deine Anfrage abzuschließen.</p>
          <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">Email bestätigen</a>
          <p style="margin:32px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">Der Link ist 24 Stunden gültig.<br>Falls du keine Anfrage gesendet hast, kannst du diese Email ignorieren.</p>
          <p style="margin:16px 0 0;font-size:12px;color:#4b5563;">Link funktioniert nicht? Kopiere diesen URL:<br><span style="color:#6b7280;word-break:break-all;">${confirmUrl}</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="color-scheme" content="light dark"><title>Please confirm your email</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Inter',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;padding:48px;border:1px solid #262626;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">mindcoded</p>
          <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#f5f5f5;line-height:1.2;">Confirm your email address</h1>
          <p style="margin:0 0 32px;font-size:16px;color:#9ca3af;line-height:1.6;">You submitted a contact request on mindcoded.de. Click the button below to confirm your email address and complete your request.</p>
          <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">Confirm email</a>
          <p style="margin:32px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">This link is valid for 24 hours.<br>If you did not submit a request, you can safely ignore this email.</p>
          <p style="margin:16px 0 0;font-size:12px;color:#4b5563;">Link not working? Copy this URL:<br><span style="color:#6b7280;word-break:break-all;">${confirmUrl}</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function successEmailHtml(email: string, locale: 'de' | 'en'): string {
  if (locale === 'de') {
    return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="color-scheme" content="light dark"><title>Anfrage bestätigt!</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Inter',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;padding:48px;border:1px solid #262626;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">mindcoded</p>
          <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#f5f5f5;line-height:1.2;">Danke! Ich melde mich bald. 👋</h1>
          <p style="margin:0 0 32px;font-size:16px;color:#9ca3af;line-height:1.6;">Deine Kontaktanfrage (${email}) wurde erfolgreich bestätigt. Ich werde mich in Kürze bei dir melden.</p>
          <p style="margin:0;font-size:14px;color:#6b7280;">Bis bald,<br><strong style="color:#e5e5e5;">Moritz — mindcoded</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="color-scheme" content="light dark"><title>Request confirmed!</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Inter',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;padding:48px;border:1px solid #262626;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">mindcoded</p>
          <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#f5f5f5;line-height:1.2;">Thanks! I'll be in touch soon. 👋</h1>
          <p style="margin:0 0 32px;font-size:16px;color:#9ca3af;line-height:1.6;">Your contact request (${email}) has been confirmed. I'll get back to you shortly.</p>
          <p style="margin:0;font-size:14px;color:#6b7280;">See you soon,<br><strong style="color:#e5e5e5;">Moritz — mindcoded</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function adminNotificationHtml(email: string, locale: 'de' | 'en'): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Neue Kontaktanfrage</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Inter',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;padding:48px;border:1px solid #262626;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">mindcoded — Admin</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#f5f5f5;">Neue bestätigte Kontaktanfrage</h1>
          <p style="margin:0 0 16px;font-size:16px;color:#9ca3af;"><strong style="color:#e5e5e5;">Email:</strong> ${email}</p>
          <p style="margin:0 0 16px;font-size:16px;color:#9ca3af;"><strong style="color:#e5e5e5;">Sprache:</strong> ${locale.toUpperCase()}</p>
          <p style="margin:0;font-size:16px;color:#9ca3af;"><strong style="color:#e5e5e5;">Zeit:</strong> ${new Date().toLocaleString('de-DE')}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
