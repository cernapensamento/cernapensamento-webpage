import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getNewsletterSecret,
  getUnsubscribeTokenSecret,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  getSiteBaseUrl,
  buildUnsubscribeUrl,
} from './newsletter';

describe('Newsletter Utility Functions (src/lib/email/newsletter.ts)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.WEBHOOK_SECRET;
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getNewsletterSecret', () => {
    it('returns WEBHOOK_SECRET when set', () => {
      process.env.WEBHOOK_SECRET = 'super_secret_webhook_123';
      expect(getNewsletterSecret()).toBe('super_secret_webhook_123');
    });

    it('throws an error when WEBHOOK_SECRET is not set', () => {
      expect(() => getNewsletterSecret()).toThrow('WEBHOOK_SECRET environment variable is not set');
    });
  });

  describe('getUnsubscribeTokenSecret', () => {
    it('returns UNSUBSCRIBE_TOKEN_SECRET when set', () => {
      process.env.UNSUBSCRIBE_TOKEN_SECRET = 'token_secret_xyz';
      process.env.WEBHOOK_SECRET = 'webhook_fallback';
      expect(getUnsubscribeTokenSecret()).toBe('token_secret_xyz');
    });

    it('falls back to WEBHOOK_SECRET when UNSUBSCRIBE_TOKEN_SECRET is unset', () => {
      process.env.WEBHOOK_SECRET = 'webhook_fallback';
      expect(getUnsubscribeTokenSecret()).toBe('webhook_fallback');
    });

    it('throws an error when neither secret is set', () => {
      expect(() => getUnsubscribeTokenSecret()).toThrow(
        'Neither UNSUBSCRIBE_TOKEN_SECRET nor WEBHOOK_SECRET environment variable is set'
      );
    });
  });

  describe('createUnsubscribeToken and verifyUnsubscribeToken', () => {
    beforeEach(() => {
      process.env.UNSUBSCRIBE_TOKEN_SECRET = 'test_token_secret';
    });

    it('creates deterministic HMAC tokens for identical email addresses regardless of case or spaces', () => {
      const token1 = createUnsubscribeToken('test@example.com');
      const token2 = createUnsubscribeToken('  TEST@Example.COM  ');
      expect(token1).toBe(token2);
      expect(token1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('verifies valid tokens correctly', () => {
      const email = 'lector@cerna.org';
      const token = createUnsubscribeToken(email);
      expect(verifyUnsubscribeToken(email, token)).toBe(true);
      expect(verifyUnsubscribeToken('  LECTOR@cerna.org ', token)).toBe(true);
    });

    it('rejects tampered or mismatched tokens', () => {
      const email = 'lector@cerna.org';
      const token = createUnsubscribeToken(email);
      const tamperedToken = token.substring(0, token.length - 2) + 'aa';
      expect(verifyUnsubscribeToken(email, tamperedToken)).toBe(false);
      expect(verifyUnsubscribeToken('other@cerna.org', token)).toBe(false);
      expect(verifyUnsubscribeToken(email, 'invalid_length')).toBe(false);
    });

    it('returns false when email or token is empty', () => {
      expect(verifyUnsubscribeToken('', 'token')).toBe(false);
      expect(verifyUnsubscribeToken('email@test.com', '')).toBe(false);
    });

    it('returns false safely without unhandled throws when secret is unset during verification', () => {
      delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
      delete process.env.WEBHOOK_SECRET;
      expect(verifyUnsubscribeToken('email@test.com', 'some_token')).toBe(false);
    });
  });

  describe('getSiteBaseUrl & buildUnsubscribeUrl', () => {
    beforeEach(() => {
      process.env.UNSUBSCRIBE_TOKEN_SECRET = 'test_secret';
    });

    it('returns configured site URL without trailing slash', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://custom-domain.org/';
      expect(getSiteBaseUrl()).toBe('https://custom-domain.org');
    });

    it('falls back to default production domain when NEXT_PUBLIC_SITE_URL is unset', () => {
      expect(getSiteBaseUrl()).toBe('https://cernapensamento.org');
    });

    it('builds RFC 8058 compliant unsubscribe URL', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://cernapensamento.org';
      const url = buildUnsubscribeUrl('user@domain.com', 'gl');
      expect(url).toContain('https://cernapensamento.org/api/newsletter/unsubscribe?');
      expect(url).toContain('email=user%40domain.com');
      expect(url).toContain('token=');
      expect(url).toContain('lang=gl');
    });
  });
});
