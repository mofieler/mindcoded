<?php
/**
 * Versandwege.
 *
 *   smtp  Einlieferung beim Mailserver mit Anmeldung (empfohlen; eigener Mailserver auf dem
 *         VPS oder Mailserver des Hosters). Der Server signiert mit DKIM.
 *   mail  PHP mail() über das lokale sendmail – nur, wo SMTP nicht möglich ist; ob signiert
 *         wird und ob die Nachricht wirklich ankommt, sieht das Skript dann nicht.
 *   file  legt die Nachricht als .eml-Datei ab – nur für lokale Tests mit »php -S«.
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

/**
 * true nur, wenn der Versandweg die Nachricht angenommen hat.
 * Empfänger: $mail['to'] (Eingangsbestätigung), sonst die Adresse des Studios.
 */
function mc_send(array $mail, array $cfg, array $settings, ?int $now = null): bool
{
    [$headers, $body] = mc_message_parts($mail, $cfg, $settings['site_name'], $now ?? time());
    $to = mc_recipient($mail, $cfg);
    return match ($cfg['transport']) {
        'smtp' => mc_smtp_send($cfg['from'], $to, mc_message_raw($headers, $body), $cfg),
        'mail' => mc_send_via_mail($to, $headers, $body, $cfg),
        'file' => mc_send_via_file(mc_message_raw($headers, $body), $cfg),
        default => false,
    };
}

function mc_send_via_mail(string $to, array $headers, string $body, array $cfg): bool
{
    $subject = $headers['Subject'];
    unset($headers['To'], $headers['Subject']); // setzt mail() selbst
    // Envelope-Absender = eigene Adresse, damit SPF zur Absender-Domain passt.
    $params = ($cfg['envelope_sender'] && mc_is_email($cfg['from'])) ? '-f' . $cfg['from'] : '';
    return mail($to, $subject, $body, $headers, $params);
}

/** Nur für lokale Tests mit »php -S«: echte Speicherung als .eml, nichts verlässt den Rechner. */
function mc_send_via_file(string $raw, array $cfg): bool
{
    if (PHP_SAPI !== 'cli-server' || $cfg['outbox_dir'] === '') {
        return false;
    }
    if (!is_dir($cfg['outbox_dir'])) {
        @mkdir($cfg['outbox_dir'], 0700, true);
    }
    $file = rtrim($cfg['outbox_dir'], '/\\') . '/' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.eml';
    return file_put_contents($file, $raw) !== false;
}
