<?php
/**
 * Prüfung der Formularfelder – dieselben Regeln wie im Browser (assets/contact-form.js),
 * Grenzen und erlaubte Werte aus contact-settings.php.
 */

declare(strict_types=1);

if (!defined('MC_CONTACT')) {
    http_response_code(404);
    exit;
}

/**
 * @return array{0: array, 1: array<string,string>} [bereinigte Daten, Fehlercodes je Feld]
 */
function mc_validate(array $input, array $settings): array
{
    $limits = $settings['limits'];
    $errors = [];

    $name = mc_clean_line($input['name'] ?? '');
    if ($name === '') {
        $errors['name'] = 'required';
    } elseif (mc_len($name) > (int) $limits['nameMax']) {
        $errors['name'] = 'too_long';
    }

    $email = mc_clean_line($input['email'] ?? '');
    if ($email === '') {
        $errors['email'] = 'required';
    } elseif (strlen($email) > (int) $limits['emailMax']) {
        $errors['email'] = 'too_long';
    } elseif (!mc_is_email($email)) {
        $errors['email'] = 'invalid';
    }

    $message = mc_clean_text($input['message'] ?? '');
    if ($message === '') {
        $errors['message'] = 'required';
    } elseif (mc_len($message) < (int) $limits['messageMin']) {
        $errors['message'] = 'too_short';
    } elseif (mc_len($message) > (int) $limits['messageMax']) {
        $errors['message'] = 'too_long';
    }

    $rawTopics = $input['topics'] ?? [];
    $rawTopics = is_array($rawTopics) ? $rawTopics : [$rawTopics];
    $nested = array_filter($rawTopics, static fn ($t) => !is_scalar($t));
    $topics = array_values(array_unique(array_filter(array_map('mc_scalar', $rawTopics), static fn ($t) => $t !== '')));
    if ($nested || array_diff($topics, $settings['topics'])) {
        $errors['topics'] = 'invalid';
    }

    $timeline = mc_scalar($input['timeline'] ?? '');
    if ($timeline !== '' && !in_array($timeline, $settings['timelines'], true)) {
        $errors['timeline'] = 'invalid';
    }

    $consent = mc_scalar($input['consent'] ?? '') !== '';
    if (!empty($settings['require_consent']) && !$consent) {
        $errors['consent'] = 'required';
    }

    $lang = mc_scalar($input['lang'] ?? '') === 'en' ? 'en' : 'de';

    return [compact('name', 'email', 'message', 'topics', 'timeline', 'consent', 'lang'), $errors];
}
