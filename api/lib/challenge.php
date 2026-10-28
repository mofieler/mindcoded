<?php
/**
 * Spam-Schutz per Rechenaufgabe (Proof-of-Work, ALTCHA-kompatibel) – ohne Dritte, ohne Cookies.
 *
 * GET contact.php?challenge liefert eine signierte Aufgabe: Gesucht ist die Zahl n (0 … maxnumber),
 * für die SHA-256(salt . n) dem Wert »challenge« entspricht. Der Browser rechnet sie im Hintergrund
 * aus (assets/pow-worker.js) und schickt die Lösung als Feld »altcha« (Base64-JSON) mit.
 *
 * Geprüft werden Signatur (HMAC mit geheimem Schlüssel im privaten Ordner), Ablaufzeit und Lösung.
 * Jede Lösung gilt nur einmal: Gelöste Aufgaben werden bis zum Ablauf gemerkt (Dateiname = Hash
 * der Aufgabe, ohne Bezug zur Person) und von »--cleanup« entfernt.
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

const MC_CHALLENGE_KEY_FILE = 'challenge.key';
const MC_CHALLENGE_USED_DIR = 'challenge-used';

/** Geheimer Signaturschlüssel; wird beim ersten Aufruf erzeugt (nur für den Webserver lesbar). */
function mc_challenge_key(array $cfg): ?string
{
    $dir = $cfg['private_dir'];
    if (!is_dir($dir) || !is_writable($dir)) {
        return null;
    }
    $file = $dir . '/' . MC_CHALLENGE_KEY_FILE;
    $key = is_file($file) ? trim((string) file_get_contents($file)) : '';
    if (strlen($key) < 64) {
        $key = bin2hex(random_bytes(32));
        $old = umask(077);
        $written = file_put_contents($file, $key, LOCK_EX);
        umask($old);
        if ($written === false) {
            return null;
        }
    }
    return $key;
}

/** Neue Aufgabe (Felder wie im ALTCHA-Protokoll). */
function mc_challenge_issue(array $cfg, array $settings, ?int $now = null): ?array
{
    $key = mc_challenge_key($cfg);
    if ($key === null) {
        return null;
    }
    $now ??= time();
    $max = (int) $settings['challenge']['max_number'];
    $salt = bin2hex(random_bytes(12)) . '?expires=' . ($now + (int) $settings['challenge']['ttl']);
    $challenge = hash('sha256', $salt . random_int(0, $max));
    return [
        'algorithm' => 'SHA-256',
        'challenge' => $challenge,
        'maxnumber' => $max,
        'salt' => $salt,
        'signature' => hash_hmac('sha256', $challenge, $key),
    ];
}

/** Ablaufzeit aus dem Salt (»…?expires=<Unixzeit>«), 0 wenn sie fehlt. */
function mc_challenge_expires(string $salt): int
{
    return preg_match('/\?expires=(\d{1,12})$/', $salt, $m) === 1 ? (int) $m[1] : 0;
}

/**
 * true, wenn die Lösung echt, gültig und noch nicht verwendet ist.
 * Merkt sie sich danach, damit dieselbe Lösung kein zweites Mal angenommen wird.
 */
function mc_challenge_verify(string $payload, array $cfg, array $settings, ?int $now = null): bool
{
    $now ??= time();
    if ($payload === '' || strlen($payload) > 1000) {
        return false;
    }
    $data = json_decode((string) base64_decode($payload, true), true);
    if (!is_array($data)) {
        return false;
    }
    $challenge = mc_scalar($data['challenge'] ?? '');
    $salt = mc_scalar($data['salt'] ?? '');
    $signature = mc_scalar($data['signature'] ?? '');
    $number = $data['number'] ?? null;
    if (($data['algorithm'] ?? '') !== 'SHA-256' || !is_int($number) || $number < 0
        || $number > (int) $settings['challenge']['max_number']
        || preg_match('/^[0-9a-f]{64}$/', $challenge) !== 1) {
        return false;
    }
    $expires = mc_challenge_expires($salt);
    if ($expires < $now || $expires > $now + (int) $settings['challenge']['ttl']) {
        return false;
    }
    $key = mc_challenge_key($cfg);
    if ($key === null
        || !hash_equals(hash_hmac('sha256', $challenge, $key), $signature)
        || !hash_equals($challenge, hash('sha256', $salt . $number))) {
        return false;
    }
    return mc_challenge_mark_used($challenge, $cfg);
}

/** Merkt eine gelöste Aufgabe; false, wenn sie schon verwendet wurde (atomar per »x«-Modus). */
function mc_challenge_mark_used(string $challenge, array $cfg): bool
{
    $dir = $cfg['private_dir'] . '/' . MC_CHALLENGE_USED_DIR;
    if (!is_dir($dir)) {
        $old = umask(077);
        @mkdir($dir, 0700, true);
        umask($old);
    }
    if (!is_dir($dir) || !is_writable($dir)) {
        return false;
    }
    if (count(glob($dir . '/*') ?: []) >= MC_MAX_RATE_FILES) {
        mc_log('challenge_store_full');
        return false;
    }
    $handle = @fopen($dir . '/' . $challenge, 'x');
    if ($handle === false) {
        return false;
    }
    fclose($handle);
    return true;
}

/** Entfernt gemerkte Lösungen, deren Aufgabe abgelaufen ist. */
function mc_challenge_cleanup(array $cfg, array $settings, int $now): int
{
    $removed = 0;
    $ttl = (int) $settings['challenge']['ttl'];
    foreach (glob($cfg['private_dir'] . '/' . MC_CHALLENGE_USED_DIR . '/*') ?: [] as $file) {
        $mtime = @filemtime($file);
        if ($mtime !== false && $mtime < $now - $ttl) {
            $removed += @unlink($file) ? 1 : 0;
        }
    }
    return $removed;
}
