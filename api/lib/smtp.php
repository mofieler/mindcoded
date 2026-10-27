<?php
/**
 * SMTP-Versand ohne Fremdbibliothek (RFC 5321; Einlieferung nach RFC 6409 und 8314).
 *
 * - »tls«      TLS ab der ersten Zeile, Port 465 – empfohlen (RFC 8314)
 *   »starttls« Klartext-Beginn, dann STARTTLS, Port 587
 *   »none«     nur für automatisierte Tests mit »php -S« gegen einen lokalen Test-Server
 * - Das Zertifikat wird immer geprüft (Name und Kette); mindestens TLS 1.2.
 * - Anmeldung mit AUTH PLAIN oder LOGIN, nie über eine unverschlüsselte Verbindung.
 * - Erfolg erst, wenn der Server die Nachricht nach DATA mit 250 angenommen hat.
 * - Protokolliert werden nur Schritt und Statuscode, nie Zugangsdaten oder Inhalte.
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

final class McSmtpError extends RuntimeException
{
}

/** Liefert true, wenn der Server die Nachricht angenommen hat. */
function mc_smtp_send(string $from, string $to, string $message, array $cfg): bool
{
    try {
        $socket = mc_smtp_connect($cfg);
    } catch (McSmtpError $e) {
        mc_log('smtp:' . $e->getMessage());
        return false;
    }
    try {
        mc_smtp_expect($socket, [220], 'greeting');
        $helo = mc_smtp_helo_name($cfg);
        $features = mc_smtp_command($socket, "EHLO {$helo}", [250], 'ehlo');
        if ($cfg['smtp_security'] === 'starttls') {
            if (!mc_smtp_supports($features, 'STARTTLS')) {
                throw new McSmtpError('starttls_unsupported');
            }
            mc_smtp_command($socket, 'STARTTLS', [220], 'starttls');
            if (@stream_socket_enable_crypto($socket, true, MC_TLS_CLIENT) !== true) {
                throw new McSmtpError('starttls_failed');
            }
            $features = mc_smtp_command($socket, "EHLO {$helo}", [250], 'ehlo_tls');
        }
        if ($cfg['smtp_user'] !== '') {
            mc_smtp_auth($socket, $features, $cfg['smtp_user'], $cfg['smtp_password']);
        }
        mc_smtp_command($socket, "MAIL FROM:<{$from}>", [250], 'mail_from');
        mc_smtp_command($socket, "RCPT TO:<{$to}>", [250, 251], 'rcpt_to');
        mc_smtp_command($socket, 'DATA', [354], 'data');
        mc_smtp_write($socket, mc_smtp_dot_stuff($message) . "\r\n.\r\n");
        mc_smtp_expect($socket, [250], 'accepted');
        try {
            mc_smtp_command($socket, 'QUIT', [221], 'quit');
        } catch (McSmtpError) {
            // Nachricht ist angenommen – ein unsauberes Ende ändert daran nichts.
        }
        return true;
    } catch (McSmtpError $e) {
        mc_log('smtp:' . $e->getMessage());
        return false;
    } finally {
        fclose($socket);
    }
}

/** @return resource */
function mc_smtp_connect(array $cfg)
{
    $host = $cfg['smtp_host'];
    $port = (int) $cfg['smtp_port'];
    $context = stream_context_create(['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'allow_self_signed' => false,
        'peer_name' => $cfg['smtp_tls_name'] !== '' ? $cfg['smtp_tls_name'] : $host,
        'SNI_enabled' => true,
        'crypto_method' => MC_TLS_CLIENT,
    ]]);
    $scheme = $cfg['smtp_security'] === 'tls' ? 'tls' : 'tcp';
    $errno = 0;
    $errstr = '';
    $socket = @stream_socket_client("{$scheme}://{$host}:{$port}", $errno, $errstr, MC_SMTP_TIMEOUT, STREAM_CLIENT_CONNECT, $context);
    if ($socket === false) {
        throw new McSmtpError("connect_failed:{$errno}");
    }
    stream_set_timeout($socket, MC_SMTP_TIMEOUT);
    return $socket;
}

/** Name für EHLO: konfiguriert, sonst der Rechnername (wenn voll qualifiziert), sonst die Absender-Domain. */
function mc_smtp_helo_name(array $cfg): string
{
    if ($cfg['smtp_helo'] !== '') {
        return $cfg['smtp_helo'];
    }
    $host = (string) gethostname();
    if (str_contains($host, '.') && mc_is_hostname($host)) {
        return $host;
    }
    return mc_domain_of($cfg['from']);
}

/**
 * Liest eine (ggf. mehrzeilige) Antwort.
 * @return array{0: int, 1: list<string>}
 */
function mc_smtp_read($socket, string $step): array
{
    $lines = [];
    while (true) {
        $line = fgets($socket, 4096);
        if ($line === false) {
            $meta = stream_get_meta_data($socket);
            throw new McSmtpError((($meta['timed_out'] ?? false) ? 'timeout:' : 'closed:') . $step);
        }
        $line = rtrim($line, "\r\n");
        $lines[] = $line;
        if (count($lines) > 100) {
            throw new McSmtpError("response_too_long:{$step}");
        }
        if (strlen($line) < 4 || $line[3] !== '-') {
            break;
        }
    }
    return [(int) substr($lines[count($lines) - 1], 0, 3), $lines];
}

/** @return list<string> */
function mc_smtp_expect($socket, array $codes, string $step): array
{
    [$code, $lines] = mc_smtp_read($socket, $step);
    if (!in_array($code, $codes, true)) {
        throw new McSmtpError("{$step}:{$code}");
    }
    return $lines;
}

function mc_smtp_write($socket, string $data): void
{
    $length = strlen($data);
    for ($written = 0; $written < $length; $written += $chunk) {
        $chunk = @fwrite($socket, substr($data, $written, 8192));
        if ($chunk === false || $chunk === 0) {
            throw new McSmtpError('write_failed');
        }
    }
}

/** @return list<string> */
function mc_smtp_command($socket, string $command, array $codes, string $step): array
{
    if (preg_match('/[\r\n]/', $command)) {
        throw new McSmtpError("invalid_command:{$step}"); // Schutz vor eingeschleusten Befehlen
    }
    mc_smtp_write($socket, $command . "\r\n");
    return mc_smtp_expect($socket, $codes, $step);
}

/** Bietet der Server eine Erweiterung an (Antwort auf EHLO)? */
function mc_smtp_supports(array $features, string $keyword): bool
{
    return array_key_exists($keyword, mc_smtp_extensions($features));
}

/** @return array<string, list<string>> Erweiterungen aus der EHLO-Antwort, z. B. ['AUTH' => ['PLAIN', 'LOGIN']] */
function mc_smtp_extensions(array $features): array
{
    $extensions = [];
    foreach (array_slice($features, 1) as $line) {
        $parts = preg_split('/[\s=]+/', strtoupper(trim(substr($line, 4)))) ?: [];
        $name = array_shift($parts);
        if ($name !== null && $name !== '') {
            $extensions[$name] = array_values(array_unique(array_merge($extensions[$name] ?? [], $parts)));
        }
    }
    return $extensions;
}

function mc_smtp_auth($socket, array $features, string $user, string $password): void
{
    $methods = mc_smtp_extensions($features)['AUTH'] ?? [];
    if (in_array('PLAIN', $methods, true)) {
        mc_smtp_command($socket, 'AUTH PLAIN ' . base64_encode("\0{$user}\0{$password}"), [235], 'auth');
        return;
    }
    if (in_array('LOGIN', $methods, true)) {
        mc_smtp_command($socket, 'AUTH LOGIN', [334], 'auth');
        mc_smtp_command($socket, base64_encode($user), [334], 'auth');
        mc_smtp_command($socket, base64_encode($password), [235], 'auth');
        return;
    }
    throw new McSmtpError('auth_unsupported');
}

/** CRLF-Zeilenenden und »Dot-Stuffing«: Zeilen mit führendem Punkt werden verdoppelt (RFC 5321 4.5.2). */
function mc_smtp_dot_stuff(string $message): string
{
    $message = preg_replace("/\r\n|\r|\n/", "\r\n", rtrim($message, "\r\n")) ?? '';
    return preg_replace('/^\./m', '..', $message) ?? '';
}
