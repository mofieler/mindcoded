<?php
/**
 * Rate-Limit pro Anschluss (höchstens N Anfragen je Zeitfenster, aus contact-settings.php).
 *
 * Gespeichert wird nur ein HMAC aus Anschluss und täglich neuem Zufallsschlüssel – nie die
 * IP-Adresse selbst. Schlüssel früherer Tage werden gelöscht; danach lassen sich alte
 * Prüfwerte niemandem mehr zuordnen. Aufräumen: php contact.php --cleanup (stündlich).
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

/** Privater Ordner für Prüfwerte – bewusst kein Rückfall auf ein gemeinsames Temp-Verzeichnis. */
function mc_rate_dir(array $cfg): ?string
{
    $dir = $cfg['private_dir'] . '/ratelimit';
    if (!is_dir($dir)) {
        $old = umask(077);
        @mkdir($dir, 0700, true);
        umask($old);
    }
    return (is_dir($dir) && is_writable($dir)) ? $dir : null;
}

function mc_daily_salt(string $dir, int $now): string
{
    $today = gmdate('Y-m-d', $now);
    $file = "{$dir}/.salt-{$today}";
    foreach (glob($dir . '/.salt-*') ?: [] as $old) {
        if ($old !== $file) {
            @unlink($old);
        }
    }
    $salt = is_file($file) ? trim((string) file_get_contents($file)) : '';
    if (strlen($salt) < 64) {
        $salt = bin2hex(random_bytes(32));
        $old = umask(077);
        file_put_contents($file, $salt, LOCK_EX);
        umask($old);
    }
    return $salt;
}

/** Entfernt abgelaufene Prüfwerte und Schlüssel früherer Tage. */
function mc_cleanup(string $dir, int $window, int $now): int
{
    $removed = 0;
    foreach (glob($dir . '/*.json') ?: [] as $file) {
        $mtime = @filemtime($file);
        if ($mtime !== false && $mtime < $now - $window) {
            $removed += @unlink($file) ? 1 : 0;
        }
    }
    mc_daily_salt($dir, $now);
    return $removed;
}

/** IPv6-Adressen werden auf ihr /64-Netz gekürzt – ein Anschluss erhält meist ein ganzes /64. */
function mc_client_key(string $ip): string
{
    $packed = @inet_pton($ip);
    if ($packed !== false && strlen($packed) === 16) {
        return bin2hex(substr($packed, 0, 8)) . '::/64';
    }
    return $ip;
}

/** true = Anfrage erlaubt. */
function mc_rate_limit(string $ip, array $cfg, array $settings, ?int $now = null): bool
{
    $now ??= time();
    $dir = mc_rate_dir($cfg);
    if ($dir === null) {
        mc_log('rate_limit_storage_unavailable');
        return true; // Formular nicht blockieren; das Ereignis steht im Fehlerprotokoll.
    }
    $max = (int) $settings['rate_limit']['max'];
    $window = (int) $settings['rate_limit']['window'];
    if (random_int(1, 20) === 1) {
        mc_cleanup($dir, $window, $now);
    }
    $files = glob($dir . '/*.json') ?: [];
    if (count($files) > MC_MAX_RATE_FILES) {
        mc_log('rate_limit_flood');
        return false;
    }

    $key = hash_hmac('sha256', mc_client_key($ip), mc_daily_salt($dir, $now));
    $file = $dir . '/' . substr($key, 0, 40) . '.json';
    $old = umask(077);
    $handle = @fopen($file, 'c+');
    umask($old);
    if ($handle === false) {
        return true;
    }
    try {
        flock($handle, LOCK_EX);
        $hits = json_decode((string) stream_get_contents($handle), true);
        $hits = array_values(array_filter(is_array($hits) ? $hits : [], static fn ($t) => is_int($t) && $t > $now - $window));
        $allowed = count($hits) < $max;
        if ($allowed) {
            $hits[] = $now;
        }
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, (string) json_encode($hits));
        fflush($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
    return $allowed;
}
