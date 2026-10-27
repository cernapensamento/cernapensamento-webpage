import crypto from 'crypto';

const DEFAULT_SECRET = 'CERNA_WEBHOOK_SECRET_98765';

/**
 * Returns WEBHOOK_SECRET, falling back to the built-in shared secret when unset
 * or empty. The same secret is used for webhook authorization and unsubscribe tokens.
 */
export function getNewsletterSecret(): string {
  return process.env.WEBHOOK_SECRET || DEFAULT_SECRET;
}

/**
 * Generates a stateless HMAC-SHA256 token for 1-click unsubscribe links.
 * Signs the trimmed, lowercase email with the newsletter secret and returns hex.
 */
export function createUnsubscribeToken(email: string): string {
  const secret = getNewsletterSecret();
  const normalizedEmail = email.trim().toLowerCase();
  return crypto
    .createHmac('sha256', secret)
    .update(normalizedEmail)
    .digest('hex');
}

/**
 * Verifies a token against the trimmed, lowercase email using a timing-safe
 * comparison for equal-length token strings. Missing input, a mismatch, or a
 * caught comparison error returns false; token generation errors propagate.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expectedToken = createUnsubscribeToken(email);
  try {
    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expectedToken);
    if (tokenBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(tokenBuf, expectedBuf);
  } catch {
    return false;
  }
}

/**
 * Returns NEXT_PUBLIC_SITE_URL with one trailing slash removed, falling back to
 * https://cernapensamento.org when unset or whitespace-only.
 */
export function getSiteBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://cernapensamento.org';
}

/**
 * Builds the unsubscribe endpoint URL with normalized email, HMAC token, and
 * locale query parameters for browser links and RFC 8058 headers.
 * Uses the configured site URL and defaults to Galician; token errors propagate.
 */
export function buildUnsubscribeUrl(email: string, lang: 'gl' | 'es' = 'gl'): string {
  const baseUrl = getSiteBaseUrl();
  const token = createUnsubscribeToken(email);
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
    token,
    lang,
  });
  return `${baseUrl}/api/newsletter/unsubscribe?${params.toString()}`;
}
