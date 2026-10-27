<?php
/**
 * Grundlagen: Konstanten, Protokoll, Text-Bereinigung, Adressprüfung.
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

const MC_MAX_BODY = 20000;                 // größte Anfrage in Byte
const MC_MAX_RATE_FILES = 10000;           // Notbremse gegen Flutung des Rate-Limit-Ordners
const MC_LOG_PREFIX = '[mindcoded-contact] ';
const MC_FAILURE_LOG = 'zustellfehler.log';
const MC_FAILURE_KEEP_DAYS = 30;
const MC_SMTP_TIMEOUT = 15;                // Sekunden je Verbindungsschritt
const MC_TLS_CLIENT = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
const MC_EMAIL_RE = "/^[A-Za-z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/";
const MC_HOST_RE = '/^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/';

function mc_log(string $event): void
{
    // Nur Ereignistypen und Statuscodes – nie Formularinhalte, Adressen oder Zugangsdaten.
    error_log(MC_LOG_PREFIX . $event);
}

function mc_len(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : (int) preg_match_all('/./us', $value);
}

/** Nur skalare Werte annehmen – verschachtelte Arrays aus manipulierten Formularen werden leer. */
function mc_scalar(mixed $value): string
{
    return is_scalar($value) ? (string) $value : '';
}

/** Einzeiliger Text: Steuerzeichen (auch Zeilenumbrüche) entfernen – verhindert Header-Injection. */
function mc_clean_line(mixed $value): string
{
    $value = mc_scalar($value);
    if (preg_match('//u', $value) !== 1) {
        return '';
    }
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
    return trim(preg_replace('/\s{2,}/u', ' ', $value) ?? '');
}

/** Mehrzeiliger Text: Zeilenumbrüche vereinheitlichen, übrige Steuerzeichen entfernen. */
function mc_clean_text(mixed $value): string
{
    $value = mc_scalar($value);
    if (preg_match('//u', $value) !== 1) {
        return '';
    }
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return trim($value);
}

/** Strenge Prüfung: keine gequoteten Local-Parts, keine IP-Literale, keine Steuerzeichen. */
function mc_is_email(string $value): bool
{
    return preg_match(MC_EMAIL_RE, $value) === 1 && filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
}

function mc_is_hostname(string $value): bool
{
    return preg_match(MC_HOST_RE, $value) === 1;
}

/** Domain einer Adresse (für Message-ID und EHLO). */
function mc_domain_of(string $address): string
{
    $at = strrpos($address, '@');
    return $at === false ? '' : strtolower(substr($address, $at + 1));
}
