<?php
/**
 * Vorlage für die Formular-Konfiguration von mindcoded.studio.
 *
 * So einrichten (Details: docs/E-MAIL.md und docs/SERVER.md):
 *  1. Auf dem Server den privaten Ordner anlegen – NIE im Webroot, z. B. /srv/mindcoded/private
 *     (Rechte 700, Eigentümer: der Benutzer, unter dem PHP-FPM läuft).
 *  2. Diese Datei dorthin kopieren, in »contact-config.php« umbenennen, Rechte 600.
 *  3. Werte eintragen. Die Datei NIE in den Webroot oder in ein Repository legen.
 *  4. Prüfen: php /srv/mindcoded/current/api/contact.php --check
 *     Testen:  php /srv/mindcoded/current/api/contact.php --send-test
 *
 * Statt dieser Datei gehen auch Umgebungsvariablen (haben Vorrang), etwa im PHP-FPM-Pool:
 *   MC_CONTACT_TO, MC_CONTACT_FROM, MC_CONTACT_TRANSPORT, MC_SMTP_HOST, MC_SMTP_PORT,
 *   MC_SMTP_SECURITY, MC_SMTP_USER, MC_SMTP_PASSWORD, MC_SMTP_TLS_NAME, MC_SMTP_HELO,
 *   MC_PRIVATE_DIR (Pfad dieses Ordners – bei Release-Ordnern mit Symlink immer setzen).
 *
 * Im privaten Ordner legt contact.php außerdem »ratelimit/« (Prüfwerte, täglicher Schlüssel)
 * und »zustellfehler.log« an. Der Ordner muss für PHP beschreibbar sein.
 */

declare(strict_types=1);

return [
    // Postfach, in dem die Anfragen ankommen, z. B. hallo@<ihre-domain>.
    'to' => 'postfach@example.com',

    // Absender – eine eigene Adresse NUR für das Formular, z. B. formular@<ihre-domain>.
    // Muss zur Domain passen, für die der Mailserver mit DKIM signiert (sonst Spam-Ordner).
    // Die Adresse des Besuchers steht automatisch in »Antwort an«.
    'from' => 'formular@example.com',

    // »smtp« (empfohlen): Einlieferung beim Mailserver mit Anmeldung – der Server signiert mit
    //        DKIM, und das Formular meldet nur Erfolg, wenn er die Nachricht angenommen hat.
    // »mail«: PHP mail() über das lokale sendmail – nur, wo SMTP nicht möglich ist.
    'transport' => 'smtp',

    // Mailserver. Eigener Stalwart auf demselben VPS: Hostname des Mailservers (Zertifikat
    // muss passen), z. B. mail.<ihre-domain>. Port 465 mit »tls« (empfohlen) oder 587 mit »starttls«.
    'smtp_host' => 'mail.example.com',
    'smtp_port' => 465,
    'smtp_security' => 'tls',

    // Anmeldung: eigenes Konto für das Formular (nur dieser Absender), starkes Zufallspasswort.
    'smtp_user' => 'formular@example.com',
    'smtp_password' => '',

    // Optional: anderer Zertifikatsname, falls smtp_host z. B. 127.0.0.1 ist.
    'smtp_tls_name' => '',

    // Optional: Name für die SMTP-Begrüßung (EHLO). Leer = Rechnername bzw. Absender-Domain.
    'smtp_helo' => '',

    // Nur bei »mail«: Envelope-Absender (-f) setzen, damit SPF zur Absender-Domain passt.
    'envelope_sender' => true,

    // Erlaubte Hostnamen für den Herkunfts-Check. Leer = nur der eigene Host.
    'allowed_hosts' => [],
];
