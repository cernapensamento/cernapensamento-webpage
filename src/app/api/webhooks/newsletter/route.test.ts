import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const mockResendBatchSend = vi.fn();
vi.mock('resend', () => {
  return {
    Resend: class {
      batch = {
        send: mockResendBatchSend,
      };
    },
  };
});

const mockPublicationsUpdate = vi.fn();
const mockPublicationsEq = vi.fn();
const mockPublicationsIs = vi.fn();
const mockPublicationsSelect = vi.fn();
const mockPublicationsMaybeSingle = vi.fn();

const mockUsersSelect = vi.fn();
const mockUsersEq = vi.fn();
const mockUsersMaybeSingle = vi.fn();

const mockRpc = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'publications') {
        return {
          update: (...args: unknown[]) => {
            mockPublicationsUpdate(...args);
            return {
              eq: (col: string, val: unknown) => {
                mockPublicationsEq(col, val);
                return {
                  is: (isCol: string, isVal: unknown) => {
                    mockPublicationsIs(isCol, isVal);
                    return {
                      select: (...sArgs: unknown[]) => {
                        mockPublicationsSelect(...sArgs);
                        return {
                          maybeSingle: mockPublicationsMaybeSingle,
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }
      if (table === 'users') {
        return {
          select: (...args: unknown[]) => {
            mockUsersSelect(...args);
            return {
              eq: (col: string, val: unknown) => {
                mockUsersEq(col, val);
                return {
                  maybeSingle: mockUsersMaybeSingle,
                };
              },
            };
          },
        };
      }
      return {};
    },
    rpc: mockRpc,
  })),
}));

describe('Newsletter Webhook API Route (/api/webhooks/newsletter)', () => {
  const originalEnv = { ...process.env };
  const WEBHOOK_SECRET = 'valid_webhook_secret_123';

  beforeEach(() => {
    process.env.WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.UNSUBSCRIBE_TOKEN_SECRET = 'valid_token_secret_456';
    process.env.RESEND_API_KEY = 're_test_key_abc';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_key_xyz';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';

    vi.clearAllMocks();

    mockPublicationsMaybeSingle.mockResolvedValue({
      data: {
        id: 'pub-uuid-1',
        title: { gl: 'Título Galego', es: 'Título Español' },
        subtitle: { gl: 'Subtítulo', es: 'Subtítulo' },
        slug: 'slug-test',
        original_language: 'gl',
        type: 'artigo',
        author_id: 'author-uuid-1',
      },
      error: null,
    });

    mockUsersMaybeSingle.mockResolvedValue({
      data: { full_name: 'Antón Reixa' },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: [
        { email: 'lector1@cerna.org', full_name: 'Lector Un' },
        { email: 'lector2@cerna.org', full_name: 'Lector Dous' },
      ],
      error: null,
    });

    mockResendBatchSend.mockResolvedValue({
      data: [{ id: 'email-1' }, { id: 'email-2' }],
      error: null,
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function createRequest(body: unknown, authHeader?: string): NextRequest {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (authHeader !== undefined) {
      headers.set('Authorization', authHeader);
    }
    return new NextRequest('http://localhost:3000/api/webhooks/newsletter', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  it('rejects unauthorized requests with 401 when Authorization header is missing or invalid', async () => {
    const reqNoAuth = createRequest({ record: { id: '1', status: 'published' } });
    const resNoAuth = await POST(reqNoAuth);
    expect(resNoAuth.status).toBe(401);

    const reqBadAuth = createRequest({ record: { id: '1', status: 'published' } }, 'Bearer wrong_token');
    const resBadAuth = await POST(reqBadAuth);
    expect(resBadAuth.status).toBe(401);
  });

  it('returns 500 without claiming when RESEND_API_KEY or SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const req = createRequest(
      { record: { id: 'pub-1', status: 'published' } },
      `Bearer ${WEBHOOK_SECRET}`
    );

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Configuración non dispoñible');
    expect(mockPublicationsUpdate).not.toHaveBeenCalled();
  });

  it('ignores event with 200 if publication is not in published status', async () => {
    const req = createRequest(
      { record: { id: 'pub-1', status: 'draft' } },
      `Bearer ${WEBHOOK_SECRET}`
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain('Non é un evento de publicación activa');
    expect(mockPublicationsUpdate).not.toHaveBeenCalled();
  });

  it('ignores event with 200 if publication has already been notified (newsletter_sent_at set)', async () => {
    const req = createRequest(
      { record: { id: 'pub-1', status: 'published', newsletter_sent_at: '2026-10-24T12:00:00Z' } },
      `Bearer ${WEBHOOK_SECRET}`
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain('xa foi notificada previamente');
    expect(mockPublicationsUpdate).not.toHaveBeenCalled();
  });

  it('returns 200 when another concurrent worker claimed the publication', async () => {
    mockPublicationsMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const req = createRequest(
      { record: { id: 'pub-1', status: 'published' } },
      `Bearer ${WEBHOOK_SECRET}`
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain('xa foi reclamada');
  });

  it('resets newsletter_sent_at claim to null and returns 500 when fetching subscribers fails', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database query timeout' },
    });

    const req = createRequest(
      { record: { id: 'pub-uuid-1', status: 'published' } },
      `Bearer ${WEBHOOK_SECRET}`
    );

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Erro ao obter a lista de subscritores');

    // Claim was initially set
    expect(mockPublicationsUpdate).toHaveBeenCalledTimes(2);
    // Second update resets newsletter_sent_at to null
    expect(mockPublicationsUpdate).toHaveBeenLastCalledWith({ newsletter_sent_at: null });
    expect(mockPublicationsEq).toHaveBeenLastCalledWith('id', 'pub-uuid-1');
  });

  it('resets newsletter_sent_at claim to null and returns non-2xx (500) when all email dispatches fail', async () => {
    mockResendBatchSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Resend API rate limit exceeded' },
    });

    const req = createRequest(
      { record: { id: 'pub-uuid-1', status: 'published' } },
      `Bearer ${WEBHOOK_SECRET}`
    );

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Non se puido enviar ningún correo da newsletter');
    expect(json.successfulDispatches).toBe(0);

    // Released claim
    expect(mockPublicationsUpdate).toHaveBeenCalledTimes(2);
    expect(mockPublicationsUpdate).toHaveBeenLastCalledWith({ newsletter_sent_at: null });
  });

  it('successfully dispatches emails, preserves claim, and returns 200', async () => {
    const req = createRequest(
      { record: { id: 'pub-uuid-1', status: 'published' } },
      `Bearer ${WEBHOOK_SECRET}`
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.successfulDispatches).toBe(2);
    expect(json.totalSubscribers).toBe(2);

    // Claim was made and NOT released
    expect(mockPublicationsUpdate).toHaveBeenCalledTimes(1);
    expect(mockResendBatchSend).toHaveBeenCalledTimes(1);
  });
});
