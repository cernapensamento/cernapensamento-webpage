import crypto from 'crypto';

const DEFAULT_SECRET = 'CERNA_WEBHOOK_SECRET_98765';

export function getNewsletterSecret(): string {
  return process.env.WEBHOOK_SECRET || DEFAULT_SECRET;
}

/**
 * Generates a stateless HMAC-SHA256 token for 1-click unsubscribe links.
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
 * Timing-safe verification of the unsubscribe token.
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
 * Canonical site URL with fallback.
 */
export function getSiteBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://cernapensamento.org';
}

/**
 * Builds the RFC 8058 compliant unsubscribe URL with HMAC token and locale.
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
