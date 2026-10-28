<?php
/**
 * Die E-Mails (RFC 5322, MIME): Benachrichtigung an das Studio und Eingangsbestätigung an die
 * anfragende Person – je als Text und HTML (multipart/alternative).
 *
 * Gestaltung und Texte erzeugt tools/build.py in api/mail-templates.php (aus Design-Tokens und
 * content/); hier werden nur Werte eingesetzt. Werte aus dem Formular werden für HTML escaped.
 *
 * Für gute Zustellung und DMARC:
 * - From ist immer die eigene Adresse (formular@…), nie die des Besuchers – sonst scheitert
 *   die Prüfung von SPF/DKIM gegen die Absender-Domain. Die Adresse des Besuchers steht in
 *   Reply-To, »Antworten« erreicht ihn trotzdem direkt.
 * - Message-ID mit der eigenen Domain, Date, MIME-Kopf, Text in UTF-8 und Base64.
 * - »Auto-Submitted« kennzeichnet die Nachrichten als automatisch erzeugt (RFC 3834), damit
 *   Abwesenheitsnotizen nicht zurückantworten.
 * - Neutrale Betreffs: Mail-Protokolle enthalten so keine Formularinhalte.
 * - Die Eingangsbestätigung enthält keine Werbung und keine Formularinhalte (auch nicht den
 *   Namen) – sonst ließe sich das Formular nutzen, um fremden Text an fremde Adressen zu senden.
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

function mc_templates(): array
{
    static $templates = null;
    return $templates ??= (array) (require MC_API_DIR . '/mail-templates.php');
}

/** Für HTML: Sonderzeichen escapen (auch ungültiges UTF-8 wird ersetzt, nie durchgereicht). */
function mc_html(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}

/** Platzhalter %name% in einer Vorlage ersetzen (Werte müssen bereits passend escaped sein). */
function mc_fill(string $template, array $values): string
{
    $pairs = [];
    foreach ($values as $key => $value) {
        $pairs["%{$key}%"] = $value;
    }
    return strtr($template, $pairs);
}

function mc_mail_date(string $lang, int $now): string
{
    $formats = mc_templates()['date_format'];
    return date($formats[$lang] ?? $formats['de'], $now);
}

/** Benachrichtigung an das Studio: alle Angaben, Antwort geht direkt an die anfragende Person. */
function mc_build_mail(array $data, array $settings, ?int $now = null): array
{
    $tpl = mc_templates()['notify'];
    $labels = $tpl['labels'];
    $topics = implode(', ', array_map(static fn ($k) => $settings['topic_labels'][$k] ?? $k, $data['topics'])) ?: '–';
    $timeline = $data['timeline'] !== '' ? ($settings['timeline_labels'][$data['timeline']] ?? $data['timeline']) : '–';
    $rows = [
        $labels['name'] => $data['name'],
        $labels['email'] => $data['email'],
        $labels['topics'] => $topics,
        $labels['timeline'] => $timeline,
        $labels['lang'] => strtoupper($data['lang']),
    ];
    $rowsHtml = '';
    $rowsText = [];
    foreach ($rows as $label => $value) {
        $rowsHtml .= mc_fill($tpl['row_html'], ['label' => mc_html($label), 'value' => mc_html($value)]);
        $rowsText[] = mc_fill($tpl['row_text'], ['label' => $label, 'value' => $value]);
    }
    $date = mc_mail_date('de', $now ?? time());
    return [
        'subject' => $tpl['subject'],
        'text' => mc_fill($tpl['text'], ['rows' => implode("\n", $rowsText), 'message' => $data['message'], 'date' => $date]),
        'html' => mc_fill($tpl['html'], ['rows' => $rowsHtml, 'message' => mc_html($data['message']), 'date' => mc_html($date)]),
        'reply_to' => $data['email'],
        'from_name' => $settings['site_name'] . ' Kontaktformular',
        'auto' => 'auto-generated',
    ];
}

/** Eingangsbestätigung an die anfragende Person – Antworten gehen an das Studio. */
function mc_build_receipt(array $data, array $cfg, array $settings, ?int $now = null): array
{
    $receipts = mc_templates()['receipt'];
    $tpl = $receipts[$data['lang']] ?? $receipts['de'];
    $date = mc_mail_date($data['lang'], $now ?? time());
    return [
        'subject' => $tpl['subject'],
        'text' => mc_fill($tpl['text'], ['date' => $date]),
        'html' => mc_fill($tpl['html'], ['date' => mc_html($date)]),
        'to' => $data['email'],
        'reply_to' => $cfg['to'],
        'from_name' => $settings['site_name'],
        'auto' => 'auto-replied',
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

/** Empfänger einer Nachricht: eigene Angabe (Eingangsbestätigung) oder das Studio. */
function mc_recipient(array $mail, array $cfg): string
{
    return (string) ($mail['to'] ?? $cfg['to']);
}

/** @return array<string,string> */
function mc_message_headers(array $mail, array $cfg, string $site, int $now, string $boundary = ''): array
{
    $headers = [
        'Date' => date(DATE_RFC2822, $now),
        'From' => mc_display_name($mail['from_name'] ?? $site . ' Kontaktformular') . ' <' . $cfg['from'] . '>',
        'To' => '<' . mc_recipient($mail, $cfg) . '>',
        'Reply-To' => '<' . $mail['reply_to'] . '>',
        'Subject' => mc_encode_header($mail['subject']),
        'Message-ID' => '<' . bin2hex(random_bytes(16)) . '@' . mc_domain_of($cfg['from']) . '>',
        'MIME-Version' => '1.0',
    ];
    if ($boundary !== '') {
        $headers['Content-Type'] = 'multipart/alternative; boundary="' . $boundary . '"';
    } else {
        $headers['Content-Type'] = 'text/plain; charset=UTF-8';
        $headers['Content-Transfer-Encoding'] = 'base64';
    }
    $headers['Auto-Submitted'] = $mail['auto'] ?? 'auto-generated';
    $headers['X-Auto-Response-Suppress'] = 'All';
    return $headers;
}

/** Text als Base64 in Zeilen zu 76 Zeichen (RFC 2045). */
function mc_message_body(string $text): string
{
    $text = preg_replace("/\r\n|\r|\n/", "\r\n", $text) ?? '';
    return rtrim(chunk_split(base64_encode($text), 76, "\r\n"));
}

/** Text- und HTML-Fassung als multipart/alternative (die bevorzugte Fassung steht zuletzt). */
function mc_message_multipart(string $text, string $html, string $boundary): string
{
    $part = static fn (string $type, string $content): string => "--{$boundary}\r\n"
        . "Content-Type: {$type}; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . mc_message_body($content) . "\r\n";
    return $part('text/plain', $text) . $part('text/html', $html) . "--{$boundary}--";
}

/**
 * Kopfzeilen und Rumpf einer Nachricht – mit HTML als multipart/alternative, sonst nur Text.
 * @return array{0: array<string,string>, 1: string}
 */
function mc_message_parts(array $mail, array $cfg, string $site, int $now): array
{
    if (($mail['html'] ?? '') === '') {
        return [mc_message_headers($mail, $cfg, $site, $now), mc_message_body($mail['text'])];
    }
    $boundary = 'mc-' . bin2hex(random_bytes(12));
    return [mc_message_headers($mail, $cfg, $site, $now, $boundary), mc_message_multipart($mail['text'], $mail['html'], $boundary)];
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
