<?php
/**
 * Protokoll nicht zugestellter Anfragen – damit ein Ausfall nicht nur dem Besucher auffällt.
 *
 * Gespeichert werden nur Zeitpunkt und Fehlertyp im privaten Ordner, nie Formularinhalte oder
 * IP-Adressen; Einträge älter als 30 Tage entfernt der Wartungslauf. Er meldet Ausfälle der
 * letzten 24 Stunden (php contact.php --cleanup, Exit-Code 2).
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

function mc_note_failure(array $cfg, string $event, int $now): void
{
    $dir = (string) ($cfg['private_dir'] ?? '');
    if ($dir === '' || !is_dir($dir) || !is_writable($dir)) {
        return;
    }
    $old = umask(077);
    @file_put_contents($dir . '/' . MC_FAILURE_LOG, gmdate('Y-m-d\TH:i:s\Z', $now) . ' ' . $event . "\n", FILE_APPEND | LOCK_EX);
    umask($old);
}

/** @return list<string> Einträge der letzten 24 Stunden */
function mc_failure_report(string $dir, int $now): array
{
    $file = $dir . '/' . MC_FAILURE_LOG;
    if (!is_file($file)) {
        return [];
    }
    $keep = [];
    $recent = [];
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $time = strtotime(explode(' ', $line, 2)[0]);
        if ($time === false || $time < $now - MC_FAILURE_KEEP_DAYS * 86400) {
            continue;
        }
        $keep[] = $line;
        if ($time >= $now - 86400) {
            $recent[] = $line;
        }
    }
    @file_put_contents($file, $keep ? implode("\n", $keep) . "\n" : '', LOCK_EX);
    return $recent;
}
