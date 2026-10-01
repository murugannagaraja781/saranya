<?php
/**
 * Naga AI Assistant (Saranya) — Message Cleaner Utility
 * Strips email reply headers, signatures, WhatsApp noise, and prompt-injection tags.
 */

class Cleaner {
    public static function cleanEmailMessage(string $rawEmail): string {
        if (empty($rawEmail)) return '';

        $cleaned = $rawEmail;

        // 1. Remove standard email reply headers
        $cleaned = preg_replace('/On\s+[A-Za-z]+,\s+[\w\s,]+at\s+[\d:]+\s*(?:AM|PM)?[^<\n]*<[^>]+>\s*wrote:[\s\S]*/i', '', $cleaned);
        $cleaned = preg_replace('/On\s+[\w\s,]+wrote:[\s\S]*/i', '', $cleaned);

        // 2. Remove Outlook / webmail reply headers
        $cleaned = preg_replace('/-----Original Message-----[\s\S]*/i', '', $cleaned);
        $cleaned = preg_replace('/_{20,}[\s\S]*/', '', $cleaned);
        $cleaned = preg_replace('/From:\s*.*(?:\r?\n)+Sent:\s*.*(?:\r?\n)+To:\s*.*(?:\r?\n)+Subject:\s*.*[\s\S]*/i', '', $cleaned);

        // 3. Remove quoted lines starting with '>'
        $lines = explode("\n", $cleaned);
        $filteredLines = array_filter($lines, function($line) {
            return strpos(trim($line), '>') !== 0;
        });
        $cleaned = implode("\n", $filteredLines);

        // 4. Remove common email signatures and footers
        $signaturePatterns = [
            '/(?:^|\n)--\s*[\r\n]+[\s\S]*/',
            '/(?:^|\n)(?:Thanks\s*(?:and|&)?\s*Regards|Best\s*Regards|Warm\s*Regards|Sincerely|Yours\s*faithfully|Cheers),?[\s\S]*/i',
            '/(?:^|\n)Sent from my (?:iPhone|iPad|Android|Galaxy|mobile device)[\s\S]*/i',
            '/(?:^|\n)Get Outlook for (?:iOS|Android)[\s\S]*/i',
            '/(?:^|\n)CONFIDENTIALITY NOTICE:?[\s\S]*/i',
            '/(?:^|\n)This e-mail and any attachments may contain confidential[\s\S]*/i',
            '/(?:^|\n)Disclaimer:?[\s\S]*/i'
        ];

        foreach ($signaturePatterns as $pattern) {
            $cleaned = preg_replace($pattern, '', $cleaned);
        }

        return trim($cleaned);
    }

    public static function cleanWhatsAppMessage(string $rawText): string {
        if (empty($rawText)) return '';

        $cleaned = str_replace(["\r\n", "\r"], "\n", $rawText);
        // Remove zero-width characters
        $cleaned = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $cleaned);
        // Strip excessive newlines
        $cleaned = preg_replace('/\n{3,}/', "\n\n", $cleaned);

        // Max safety clamp to 2500 chars
        if (mb_strlen($cleaned) > 2500) {
            $cleaned = mb_substr($cleaned, 0, 2500) . '... [truncated]';
        }

        return trim($cleaned);
    }

    public static function sanitizeForPrompt(string $text): string {
        if (empty($text)) return '';

        $sanitized = str_ireplace(
            ['<untrusted_client_message>', '</untrusted_client_message>', '<system_instructions>', '</system_instructions>'],
            ['[client_tag_removed]', '[/client_tag_removed]', '[system_tag_removed]', '[/system_tag_removed]'],
            $text
        );

        return trim($sanitized);
    }

    public static function cleanInboundMessage(string $channel, string $text): string {
        if ($channel === 'email') {
            return self::cleanEmailMessage($text);
        }
        return self::cleanWhatsAppMessage($text);
    }
}
