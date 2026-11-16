import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import * as auth from '@/lib/auth';
import { USER_ROLES } from '@/lib/db/schema';
import type { User } from '@supabase/supabase-js';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: '---TITLE---\nTítulo traducido\n---SUBTITLE---\nSubtítulo traducido\n---HTMLCONTENT---\n<p>Contido traducido</p>',
        }),
      },
    })),
  };
});

describe('POST /api/translate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(auth, 'getAuthenticatedUser').mockResolvedValue({
      user: null,
      profile: null,
      role: null,
    });

    const req = new Request('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Original Title',
        targetLanguage: 'gl',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Autenticación requerida');
  });

  it('rejects reader role with 403', async () => {
    vi.spyOn(auth, 'getAuthenticatedUser').mockResolvedValue({
      user: { id: 'reader-1' } as unknown as User,
      profile: null,
      role: USER_ROLES.READER,
    });

    const req = new Request('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Original Title',
        targetLanguage: 'gl',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Permisos insuficientes para traducir');
  });

  it('rejects oversized payload with 413', async () => {
    vi.spyOn(auth, 'getAuthenticatedUser').mockResolvedValue({
      user: { id: 'writer-1' } as unknown as User,
      profile: null,
      role: USER_ROLES.MEMBER,
    });

    const req = new Request('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'a'.repeat(600), // Exceeds 500 limit
        targetLanguage: 'gl',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('allows authorized writer to translate', async () => {
    vi.spyOn(auth, 'getAuthenticatedUser').mockResolvedValue({
      user: { id: 'writer-1' } as unknown as User,
      profile: null,
      role: USER_ROLES.MEMBER,
    });

    const req = new Request('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Original Title',
        subtitle: 'Original Subtitle',
        htmlContent: '<p>Contenido original</p>',
        targetLanguage: 'gl',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toBe('Título traducido');
    expect(json.subtitle).toBe('Subtítulo traducido');
    expect(json.htmlContent).toBe('<p>Contido traducido</p>');
  });
});
