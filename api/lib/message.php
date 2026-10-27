<?php
/**
 * Die E-Mail an das Studio (RFC 5322, MIME).
 *
 * Für gute Zustellung und DMARC:
 * - From ist immer die eigene Adresse (formular@…), nie die des Besuchers – sonst scheitert
 *   die Prüfung von SPF/DKIM gegen die Absender-Domain. Die Adresse des Besuchers steht in
 *   Reply-To, »Antworten« erreicht ihn trotzdem direkt.
 * - Message-ID mit der eigenen Domain, Date, MIME-Kopf, Text in UTF-8 und Base64.
 * - »Auto-Submitted« kennzeichnet die Nachricht als automatisch erzeugt (RFC 3834), damit
 *   Abwesenheitsnotizen nicht zurückantworten.
 * - Neutraler Betreff: Mail-Protokolle enthalten so keine Formularinhalte.
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

/** Inhalt der Nachricht: Betreff, Text, Antwortadresse. */
function mc_build_mail(array $data, array $settings): array
{
    $topics = implode(', ', array_map(static fn ($k) => $settings['topic_labels'][$k] ?? $k, $data['topics'])) ?: '–';
    $timeline = $data['timeline'] !== '' ? ($settings['timeline_labels'][$data['timeline']] ?? $data['timeline']) : '–';
    $site = $settings['site_name'];
    $text = implode("\n", [
        "Neue Anfrage über das Kontaktformular von {$site}",
        '',
        "Name:        {$data['name']}",
        "E-Mail:      {$data['email']}",
        "Themen:      {$topics}",
        "Zeitrahmen:  {$timeline}",
        'Sprache:     ' . strtoupper($data['lang']),
        '',
        'Nachricht:',
        $data['message'],
        '',
        '-- ',
        "Gesendet über {$site} am " . date('d.m.Y \u\m H:i') . ' Uhr.',
        'Mit »Antworten« schreiben Sie direkt an die anfragende Person.',
    ]);
    return [
        'subject' => "Neue Anfrage über {$site}",
        'text' => $text,
        'reply_to' => $data['email'],
    ];
}

/** Kopfzeilen-Wert mit Umlauten als MIME-Encoded-Word (RFC 2047), sonst unverändert. */
function mc_encode_header(string $value): string
{
    if (!preg_match('/[^\x20-\x7E]/', $value)) {
        return $value;
    }
    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($value, 'UTF-8', 'B', "\r\n");
    }
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

/** Anzeigename: ASCII in Anführungszeichen (Punkte sind sonst nicht erlaubt), sonst kodiert. */
function mc_display_name(string $name): string
{
    if (preg_match('/[^\x20-\x7E]/', $name)) {
        return mc_encode_header($name);
    }
    return '"' . addcslashes($name, '"\\') . '"';
}

/** @return array<string,string> */
function mc_message_headers(array $mail, array $cfg, string $site, int $now): array
{
    return [
        'Date' => date(DATE_RFC2822, $now),
        'From' => mc_display_name($site . ' Kontaktformular') . ' <' . $cfg['from'] . '>',
        'To' => '<' . $cfg['to'] . '>',
        'Reply-To' => '<' . $mail['reply_to'] . '>',
        'Subject' => mc_encode_header($mail['subject']),
        'Message-ID' => '<' . bin2hex(random_bytes(16)) . '@' . mc_domain_of($cfg['from']) . '>',
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => 'base64',
        'Auto-Submitted' => 'auto-generated',
        'X-Auto-Response-Suppress' => 'All',
    ];
}

/** Text als Base64 in Zeilen zu 76 Zeichen (RFC 2045). */
function mc_message_body(string $text): string
{
    $text = preg_replace("/\r\n|\r|\n/", "\r\n", $text) ?? '';
    return rtrim(chunk_split(base64_encode($text), 76, "\r\n"));
}

/** Vollständige Nachricht mit CRLF-Zeilenenden. */
function mc_message_raw(array $headers, string $body): string
{
    $lines = [];
    foreach ($headers as $name => $value) {
        $lines[] = "{$name}: {$value}";
    }
    return implode("\r\n", $lines) . "\r\n\r\n" . $body . "\r\n";
}
