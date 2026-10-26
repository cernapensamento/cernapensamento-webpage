import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createUnsubscribeToken } from '@/lib/email/newsletter';
import { GET, POST } from './route';

const mockRpc = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}));

describe('Newsletter Unsubscribe API Route (/api/newsletter/unsubscribe)', () => {
  const originalEnv = { ...process.env };
  const testEmail = 'lector@cerna.org';
  const validToken = createUnsubscribeToken(testEmail);

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_service_key';
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ data: true, error: null });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('GET (browser click)', () => {
    it('returns 400 HTML with error notice on invalid or missing token', async () => {
      const req = new NextRequest('http://localhost:3000/api/newsletter/unsubscribe?email=test@test.com&token=bad');
      const res = await GET(req);

      expect(res.status).toBe(400);
      const html = await res.text();
      expect(html).toContain('<!DOCTYPE html>');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('unsubscribes user via RPC and returns 200 HTML on valid token', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/newsletter/unsubscribe?email=${testEmail}&token=${validToken}&lang=gl`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith('unsubscribe_newsletter_by_email', {
        target_email: testEmail,
      });
      const html = await res.text();
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('returns 500 HTML when Supabase RPC returns an error', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const req = new NextRequest(
        `http://localhost:3000/api/newsletter/unsubscribe?email=${testEmail}&token=${validToken}`
      );
      const res = await GET(req);

      expect(res.status).toBe(500);
    });
  });

  describe('POST (RFC 8058 One-Click client)', () => {
    it('returns 400 JSON when token is missing or invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/newsletter/unsubscribe?email=a@b.com&token=fake', {
        method: 'POST',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('returns 200 JSON with success message on valid token', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/newsletter/unsubscribe?email=${testEmail}&token=${validToken}`,
        { method: 'POST' }
      );
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('unsubscribe_newsletter_by_email', {
        target_email: testEmail,
      });
    });
  });
});
