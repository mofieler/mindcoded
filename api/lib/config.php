<?php
/**
 * Einstellungen und Konfiguration.
 *
 * - Einstellungen (Grenzen, Themen, Weiterleitungen) erzeugt tools/build.py in
 *   api/contact-settings.php aus content/ – dieselben Regeln wie im Browser.
 * - Konfiguration (Adressen, Versandweg, Zugangsdaten) liegt nie im Webroot und nie im
 *   Repository: Umgebungsvariablen oder <MC_PRIVATE_DIR>/contact-config.php
 *   (Vorlage: docs/contact-config.example.php). Umgebungsvariablen haben Vorrang.
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

function mc_settings(): array
{
    static $settings = null;
    if ($settings === null) {
        $settings = require MC_API_DIR . '/contact-settings.php';
        // Nur für automatisierte Tests mit »php -S«: höheres Limit per Umgebungsvariable.
        $override = (int) getenv('MC_RATE_LIMIT_MAX');
        if ($override > 0 && PHP_SAPI === 'cli-server') {
            $settings['rate_limit']['max'] = $override;
        }
    }
    return $settings;
}

function mc_config(): array
{
    static $cfg = null;
    if ($cfg !== null) {
        return $cfg;
    }
    $env = static function (string $key): ?string {
        $value = getenv($key);
        return ($value === false || $value === '') ? null : $value;
    };
    // Standard: Ordner »mindcoded-private« neben dem Webroot. Bei Release-Ordnern mit Symlink
    // (tools/deploy.py --ssh) zeigt __DIR__ in den Release – dann MC_PRIVATE_DIR setzen.
    $privateDir = $env('MC_PRIVATE_DIR') ?? dirname(MC_API_DIR, 2) . '/mindcoded-private';
    $file = $privateDir . '/contact-config.php';
    $fromFile = is_file($file) ? (array) (require $file) : [];
    $value = static fn (string $envKey, string $fileKey, string $default = ''): string
        => $env($envKey) ?? (string) ($fromFile[$fileKey] ?? $default);

    $cfg = [
        'to' => $value('MC_CONTACT_TO', 'to'),
        'from' => $value('MC_CONTACT_FROM', 'from'),
        'transport' => $value('MC_CONTACT_TRANSPORT', 'transport', 'smtp'),
        'smtp_host' => $value('MC_SMTP_HOST', 'smtp_host'),
        'smtp_port' => (int) $value('MC_SMTP_PORT', 'smtp_port', '465'),
        'smtp_security' => $value('MC_SMTP_SECURITY', 'smtp_security', 'tls'),
        'smtp_user' => $value('MC_SMTP_USER', 'smtp_user'),
        'smtp_password' => $value('MC_SMTP_PASSWORD', 'smtp_password'),
        'smtp_tls_name' => $value('MC_SMTP_TLS_NAME', 'smtp_tls_name'),
        'smtp_helo' => $value('MC_SMTP_HELO', 'smtp_helo'),
        'envelope_sender' => (bool) ($fromFile['envelope_sender'] ?? true),
        'allowed_hosts' => (array) ($fromFile['allowed_hosts'] ?? []),
        'outbox_dir' => (string) ($fromFile['outbox_dir'] ?? ''),
        'private_dir' => $privateDir,
    ];
    return $cfg;
}

/**
 * Konfigurationsfehler als Liste (leer = bereit). Die Meldungen nennen nie Zugangsdaten.
 * @return list<string>
 */
function mc_config_problems(array $cfg): array
{
    $problems = [];
    if (!mc_is_email($cfg['to'])) {
        $problems[] = 'to: keine gültige Empfängeradresse';
    }
    if (!mc_is_email($cfg['from'])) {
        $problems[] = 'from: keine gültige Absenderadresse';
    }
    switch ($cfg['transport']) {
        case 'smtp':
            if (!mc_is_hostname($cfg['smtp_host'])) {
                $problems[] = 'smtp_host: fehlt oder ungültig';
            }
            if ($cfg['smtp_port'] < 1 || $cfg['smtp_port'] > 65535) {
                $problems[] = 'smtp_port: ungültig';
            }
            if (!in_array($cfg['smtp_security'], ['tls', 'starttls', 'none'], true)) {
                $problems[] = 'smtp_security: »tls« (Port 465) oder »starttls« (Port 587)';
            } elseif ($cfg['smtp_security'] === 'none' && PHP_SAPI !== 'cli-server') {
                $problems[] = 'smtp_security »none« ist nur für lokale Tests erlaubt';
            }
            if (($cfg['smtp_user'] === '') !== ($cfg['smtp_password'] === '')) {
                $problems[] = 'smtp_user und smtp_password nur gemeinsam angeben';
            }
            if ($cfg['smtp_tls_name'] !== '' && !mc_is_hostname($cfg['smtp_tls_name'])) {
                $problems[] = 'smtp_tls_name: ungültiger Hostname';
            }
            if ($cfg['smtp_helo'] !== '' && !mc_is_hostname($cfg['smtp_helo'])) {
                $problems[] = 'smtp_helo: ungültiger Hostname';
            }
            break;
        case 'mail':
            if (!function_exists('mail')) {
                $problems[] = 'mail() ist auf diesem Server deaktiviert – transport »smtp« verwenden';
            }
            break;
        case 'file':
            if (PHP_SAPI !== 'cli-server') {
                $problems[] = 'transport »file« ist nur für lokale Tests erlaubt';
            }
            break;
        default:
            $problems[] = 'transport: »smtp« (empfohlen) oder »mail«';
    }
    return $problems;
}
