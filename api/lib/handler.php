<?php
/**
 * Ablauf einer Anfrage und Wartungsbefehle.
 *
 * POST → Herkunft → Größe → Rate-Limit → Spam-Schutz → Prüfung → Konfiguration → Versand.
 * Antwort: JSON, wenn der Browser »Accept: application/json« sendet (Formular mit JavaScript),
 * sonst Weiterleitung auf die Danke- bzw. Fehlerseite (Formular ohne JavaScript).
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

function mc_result(int $status, array $body, string $lang = 'de'): array
{
    return ['status' => $status, 'body' => $body, 'lang' => $lang];
}

function mc_wants_json(array $server): bool
{
    return str_contains(strtolower((string) ($server['HTTP_ACCEPT'] ?? '')), 'application/json');
}

/**
 * Nur Absendungen von dieser Website: fremder oder undurchsichtiger Origin (»null«) und
 * Cross-Site-Anfragen laut Sec-Fetch-Site werden abgelehnt.
 */
function mc_origin_ok(array $server, array $cfg): bool
{
    $site = strtolower((string) ($server['HTTP_SEC_FETCH_SITE'] ?? ''));
    if (in_array($site, ['cross-site', 'same-site'], true)) {
        return false;
    }
    if (!array_key_exists('HTTP_ORIGIN', $server)) {
        return true; // ältere Browser senden bei gleicher Herkunft keinen Origin
    }
    $origin = (string) $server['HTTP_ORIGIN'];
    if ($origin === '' || strtolower($origin) === 'null') {
        return false;
    }
    $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $ownHost = strtolower((string) preg_replace('/:\d+$/', '', (string) ($server['HTTP_HOST'] ?? '')));
    $allowed = array_map('strtolower', $cfg['allowed_hosts'] ?: [$ownHost]);
    return $originHost !== '' && in_array($originHost, $allowed, true);
}

/**
 * Verarbeitet eine Anfrage und liefert [status, body, lang] – ohne Ausgabe, damit testbar.
 * $sender kann in Tests den Versand ersetzen.
 */
function mc_handle(array $server, array $post, string $raw, ?callable $sender = null, ?int $now = null): array
{
    $now ??= time();
    $settings = mc_settings();
    $cfg = mc_config();

    if (strtoupper((string) ($server['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        return mc_result(405, ['ok' => false, 'error' => 'method_not_allowed']);
    }
    if ((int) ($server['CONTENT_LENGTH'] ?? 0) > MC_MAX_BODY || strlen($raw) > MC_MAX_BODY) {
        return mc_result(413, ['ok' => false, 'error' => 'too_large']);
    }
    if (!mc_origin_ok($server, $cfg)) {
        return mc_result(403, ['ok' => false, 'error' => 'forbidden']);
    }

    $input = $post;
    if (str_contains(strtolower((string) ($server['CONTENT_TYPE'] ?? '')), 'application/json')) {
        $decoded = json_decode($raw, true);
        $input = is_array($decoded) ? $decoded : [];
    }
    $lang = mc_scalar($input['lang'] ?? '') === 'en' ? 'en' : 'de';

    if (!mc_rate_limit((string) ($server['REMOTE_ADDR'] ?? '0.0.0.0'), $cfg, $settings, $now)) {
        mc_log('rate_limited');
        return mc_result(429, ['ok' => false, 'error' => 'rate_limited'], $lang);
    }

    // Spam-Schutz: Honeypot-Feld ausgefüllt oder Formular unrealistisch schnell abgeschickt.
    // Antwortet wie bei Erfolg, damit Programme nichts lernen – es wird aber nichts versendet.
    if (trim(mc_scalar($input['website'] ?? '')) !== '') {
        mc_log('spam_honeypot');
        return mc_result(200, ['ok' => true], $lang);
    }
    // »elapsed« misst der Browser selbst (performance.now) – unabhängig von seiner Uhrzeit.
    $elapsed = mc_scalar($input['elapsed'] ?? '');
    $minMs = (int) ($settings['limits']['minFillSeconds'] ?? 3) * 1000;
    if (ctype_digit($elapsed) && (int) $elapsed < $minMs) {
        mc_log('spam_too_fast');
        return mc_result(200, ['ok' => true], $lang);
    }

    [$data, $errors] = mc_validate($input, $settings);
    if ($errors) {
        return mc_result(422, ['ok' => false, 'error' => 'validation', 'fields' => $errors], $lang);
    }

    if (mc_config_problems($cfg)) {
        mc_log('not_configured');
        mc_note_failure($cfg, 'not_configured', $now);
        return mc_result(503, ['ok' => false, 'error' => 'not_configured'], $lang);
    }

    $mail = mc_build_mail($data, $settings);
    $sent = $sender ? (bool) $sender($mail, $cfg) : mc_send($mail, $cfg, $settings, $now);
    if (!$sent) {
        mc_log('send_failed:' . $cfg['transport']);
        mc_note_failure($cfg, 'send_failed:' . $cfg['transport'], $now);
        return mc_result(502, ['ok' => false, 'error' => 'send_failed'], $lang);
    }
    return mc_result(200, ['ok' => true], $lang);
}

function mc_respond(array $result, array $server): void
{
    header_remove('X-Powered-By');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    header('Referrer-Policy: same-origin');
    if ($result['status'] === 405) {
        header('Allow: POST');
    }
    if (mc_wants_json($server) || $result['status'] === 405) {
        http_response_code($result['status']);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($result['body'], JSON_UNESCAPED_UNICODE);
        return;
    }
    // Ohne JavaScript: weiter zur passenden Seite (Post/Redirect/Get).
    $base = rtrim(str_replace('\\', '/', dirname((string) ($server['SCRIPT_NAME'] ?? '/api/contact.php'), 2)), '/') . '/';
    $page = mc_settings()['redirects'][$result['lang']][$result['body']['ok'] ? 'success' : 'error'];
    header('Location: ' . $base . $page, true, 303);
}

/* ------------------------------------------------------------------ Wartung (Kommandozeile) */

const MC_CLI_USAGE = <<<TXT
Aufruf:
  php contact.php --cleanup     abgelaufene Prüfwerte löschen, Zustellfehler melden (stündlich per Cron/Timer)
  php contact.php --check       Konfiguration prüfen, ohne etwas zu senden
  php contact.php --send-test   Testnachricht über den konfigurierten Versandweg an die Empfängeradresse

TXT;

function mc_cli(array $argv): int
{
    $command = $argv[1] ?? '';
    $cfg = mc_config();
    return match ($command) {
        '--cleanup' => mc_cli_cleanup($cfg),
        '--check' => mc_cli_check($cfg),
        '--send-test' => mc_cli_send_test($cfg),
        default => mc_cli_usage(),
    };
}

function mc_cli_usage(): int
{
    fwrite(STDERR, MC_CLI_USAGE);
    return 1;
}

function mc_cli_cleanup(array $cfg): int
{
    $dir = mc_rate_dir($cfg);
    if ($dir === null) {
        fwrite(STDERR, "Privater Ordner nicht beschreibbar – MC_PRIVATE_DIR prüfen.\n");
        return 1;
    }
    $now = time();
    $removed = mc_cleanup($dir, (int) mc_settings()['rate_limit']['window'], $now);
    echo date('c') . " Abgelaufene Prüfwerte gelöscht: {$removed}\n";
    $failures = mc_failure_report($cfg['private_dir'], $now);
    if ($failures) {
        echo 'ACHTUNG: ' . count($failures) . ' Anfrage(n) in den letzten 24 Stunden nicht zugestellt ('
            . MC_FAILURE_LOG . " im privaten Ordner). Prüfen: php contact.php --check und --send-test\n";
        foreach ($failures as $line) {
            echo "  {$line}\n";
        }
        return 2;
    }
    return 0;
}

function mc_cli_check(array $cfg): int
{
    echo "Versandweg:     {$cfg['transport']}\n";
    if ($cfg['transport'] === 'smtp') {
        echo "SMTP-Server:    {$cfg['smtp_host']}:{$cfg['smtp_port']} ({$cfg['smtp_security']})\n";
        echo 'Anmeldung:      ' . ($cfg['smtp_user'] !== '' ? 'ja (Benutzer gesetzt)' : 'nein') . "\n";
    }
    echo 'Privater Ordner: ' . (mc_rate_dir($cfg) !== null ? 'beschreibbar' : 'NICHT beschreibbar') . "\n";
    $problems = mc_config_problems($cfg);
    foreach ($problems as $problem) {
        echo "FEHLER: {$problem}\n";
    }
    echo $problems ? "Nicht bereit.\n" : "Bereit. Testnachricht: php contact.php --send-test\n";
    return $problems ? 1 : 0;
}

function mc_cli_send_test(array $cfg): int
{
    $problems = mc_config_problems($cfg);
    if ($problems) {
        fwrite(STDERR, 'Konfiguration unvollständig: ' . implode('; ', $problems) . "\n");
        return 1;
    }
    $settings = mc_settings();
    $mail = [
        'subject' => "Testnachricht von {$settings['site_name']}",
        'text' => "Diese Nachricht prüft den Versandweg des Kontaktformulars.\n\n"
            . "Prüfen Sie im Postfach die Kopfzeilen (»Original anzeigen«): SPF, DKIM und DMARC sollten »pass« zeigen.\n",
        'reply_to' => $cfg['from'],
    ];
    if (!mc_send($mail, $cfg, $settings)) {
        fwrite(STDERR, "Versand fehlgeschlagen – Schritt und Code stehen in der Zeile mit »[mindcoded-contact] smtp:« darüber.\n");
        return 1;
    }
    echo "Angenommen. Bitte im Postfach von {$cfg['to']} nachsehen.\n";
    return 0;
}

function mc_main(): void
{
    // Kommandozeile (auch php-cgi im Cron, dort ohne REQUEST_METHOD)
    if (PHP_SAPI === 'cli' || !isset($_SERVER['REQUEST_METHOD'])) {
        exit(mc_cli($_SERVER['argv'] ?? []));
    }
    try {
        $raw = (string) file_get_contents('php://input', false, null, 0, MC_MAX_BODY + 1);
        $result = mc_handle($_SERVER, $_POST, $raw);
    } catch (Throwable $e) {
        mc_log('internal_error:' . get_class($e));
        try {
            mc_note_failure(mc_config(), 'internal_error:' . get_class($e), time());
        } catch (Throwable) {
            // Protokoll ist Zusatz – die Antwort an den Besucher darf daran nicht scheitern.
        }
        $result = mc_result(500, ['ok' => false, 'error' => 'internal'], mc_scalar($_POST['lang'] ?? '') === 'en' ? 'en' : 'de');
    }
    mc_respond($result, $_SERVER);
}
