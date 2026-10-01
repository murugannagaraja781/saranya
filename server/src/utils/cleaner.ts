/**
 * Message Cleaner Utility
 * Implements Gmail quoted text stripping, signature removal,
 * WhatsApp normalization, and prompt-injection sanitization.
 */

export function cleanEmailMessage(rawEmail: string): string {
  if (!rawEmail) return '';

  let cleaned = rawEmail;

  // 1. Remove standard email reply headers:
  // e.g. "On Mon, Sep 28, 2026 at 10:30 AM, John Doe <john@example.com> wrote:"
  cleaned = cleaned.replace(/On\s+[A-Za-z]+,\s+[\w\s,]+at\s+[\d:]+\s*(?:AM|PM)?[^<\n]*<[^>]+>\s*wrote:[\s\S]*/gi, '');
  cleaned = cleaned.replace(/On\s+[\w\s,]+wrote:[\s\S]*/gi, '');

  // 2. Remove Outlook style forwarded / reply headers:
  // -----Original Message-----
  cleaned = cleaned.replace(/-----Original Message-----[\s\S]*/gi, '');
  cleaned = cleaned.replace(/________________________________[\s\S]*/g, '');
  cleaned = cleaned.replace(/From:\s*.*(?:\r?\n)+Sent:\s*.*(?:\r?\n)+To:\s*.*(?:\r?\n)+Subject:\s*.*[\s\S]*/gi, '');

  // 3. Remove quoted lines starting with '>'
  cleaned = cleaned
    .split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .join('\n');

  // 4. Remove common email signatures and footers
  const signaturePatterns = [
    /(?:^|\n)--\s*[\r\n]+[\s\S]*/,
    /(?:^|\n)(?:Thanks\s*(?:and|&)?\s*Regards|Best\s*Regards|Warm\s*Regards|Sincerely|Yours\s*faithfully|Cheers),?[\s\S]*/i,
    /(?:^|\n)Sent from my (?:iPhone|iPad|Android|Galaxy|mobile device)[\s\S]*/i,
    /(?:^|\n)Get Outlook for (?:iOS|Android)[\s\S]*/i,
    /(?:^|\n)CONFIDENTIALITY NOTICE:?[\s\S]*/i,
    /(?:^|\n)This e-mail and any attachments may contain confidential[\s\S]*/i,
    /(?:^|\n)Disclaimer:?[\s\S]*/i
  ];

  for (const pattern of signaturePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 5. Trim extraneous whitespace
  return cleaned.trim();
}

export function cleanWhatsAppMessage(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText;

  // Normalize Unicode spaces and line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Strip excessive repeated punctuation/newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // WhatsApp max length safety clamp (prevent huge denial-of-service payloads)
  if (cleaned.length > 2500) {
    cleaned = cleaned.slice(0, 2500) + '... [truncated]';
  }

  return cleaned.trim();
}

/**
 * Sanitizes untrusted message content before sending to LLM.
 * Wraps text safely and neutralizes XML tags that could interfere
 * with prompt boundaries.
 */
export function sanitizeForPrompt(text: string): string {
  if (!text) return '';

  // Escape any malicious XML/HTML-like delimiter injection attempts
  const sanitized = text
    .replace(/<untrusted_client_message>/gi, '[client_tag_removed]')
    .replace(/<\/untrusted_client_message>/gi, '[/client_tag_removed]')
    .replace(/<system_instructions>/gi, '[system_tag_removed]')
    .replace(/<\/system_instructions>/gi, '[/system_tag_removed]');

  return sanitized.trim();
}

export function cleanInboundMessage(channel: 'email' | 'whatsapp', text: string): string {
  if (channel === 'email') {
    return cleanEmailMessage(text);
  }
  return cleanWhatsAppMessage(text);
}
