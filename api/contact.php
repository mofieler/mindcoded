<?php
/**
 * mindcoded.studio – Kontaktformular-Endpunkt (PHP 8.1+, ohne Fremdbibliotheken)
 *
 * Erfolg wird nur gemeldet, wenn der Mailserver die Nachricht tatsächlich angenommen hat.
 * Bausteine in api/lib/ (vom Webserver gesperrt, nie direkt aufrufbar):
 *   support.php    Konstanten, Protokoll, Text-Bereinigung, Adressprüfung
 *   config.php     Einstellungen (aus content/) und Konfiguration (Umgebung / privater Ordner)
 *   validate.php   Feldprüfung – dieselben Regeln wie im Browser
 *   ratelimit.php  Anfragen je Anschluss begrenzen, ohne IP-Adressen zu speichern
 *   message.php    die E-Mail selbst (RFC 5322, DMARC-gerecht)
 *   smtp.php       SMTP-Client mit TLS und Anmeldung
 *   transport.php  Versandwege smtp / mail / file
 *   failures.php   Protokoll nicht zugestellter Anfragen
 *   handler.php    Ablauf einer Anfrage, Wartungsbefehle
 *
 * Konfiguration – nie im Webroot, nie im Repository:
 *   Umgebungsvariablen (MC_CONTACT_TO, MC_CONTACT_FROM, MC_SMTP_HOST, MC_SMTP_USER,
 *   MC_SMTP_PASSWORD, MC_PRIVATE_DIR …) oder <MC_PRIVATE_DIR>/contact-config.php.
 *   Vorlage: docs/contact-config.example.php · Einrichtung: docs/E-MAIL.md
 *
 * Wartung auf dem Server:
 *   php contact.php --cleanup     stündlich (Timer/Cron): Prüfwerte löschen, Zustellfehler melden
 *   php contact.php --check       Konfiguration prüfen
 *   php contact.php --send-test   Testnachricht senden
 */

declare(strict_types=1);

ini_set('display_errors', '0');

const MC_CONTACT = true;
const MC_API_DIR = __DIR__;

require __DIR__ . '/lib/support.php';
require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/validate.php';
require __DIR__ . '/lib/ratelimit.php';
require __DIR__ . '/lib/message.php';
require __DIR__ . '/lib/smtp.php';
require __DIR__ . '/lib/transport.php';
require __DIR__ . '/lib/failures.php';
require __DIR__ . '/lib/handler.php';

if (realpath(__FILE__) === realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? ''))) {
    mc_main();
}
