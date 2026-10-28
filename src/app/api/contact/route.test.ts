import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Resend } from 'resend';
import { POST } from './route';

describe('Contact API Route (POST /api/contact)', () => {
  const originalEnv = { ...process.env };
  const dummyResend = new Resend('re_dummy_initial');
  const EmailsClass = Object.getPrototypeOf(dummyResend.emails).constructor;
  const originalSend = EmailsClass.prototype.send;

  interface MockSendPayload {
    from: string;
    to: string[];
    replyTo?: string;
    subject: string;
    html: string;
    text: string;
    attachments?: Array<{ filename: string; content: Buffer }>;
  }

  let capturedPayload: MockSendPayload | null = null;
  let mockSendResult: { data: { id: string } | null; error: unknown } = {
    data: { id: 'email_test_123' },
    error: null,
  };

  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_dummy_key';
    process.env.CONTACT_FROM_EMAIL = 'Cerna Contacto <contacto@cernapensamento.org>';
    process.env.CONTACT_TO_EMAIL = 'contacto@cernapensamento.org';
    capturedPayload = null;
    mockSendResult = { data: { id: 'email_test_123' }, error: null };

    EmailsClass.prototype.send = vi.fn(async function (payload: MockSendPayload) {
      capturedPayload = payload;
      return mockSendResult;
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    EmailsClass.prototype.send = originalSend;
    vi.restoreAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const formData = new FormData();
    formData.append('email', 'reader@example.com');
    // fullName and message are missing

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('missing_fields');
    expect(capturedPayload).toBeNull();
  });

  it('returns 400 when email format is invalid', async () => {
    const formData = new FormData();
    formData.append('email', 'not-an-email');
    formData.append('fullName', 'Xurxo');
    formData.append('message', 'Ola a todos');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_email');
    expect(capturedPayload).toBeNull();
  });

  it('returns 400 when fields exceed maximum length', async () => {
    const formData = new FormData();
    formData.append('email', 'reader@example.com');
    formData.append('fullName', 'A'.repeat(201)); // max 200
    formData.append('message', 'Ola');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('too_long');
    expect(capturedPayload).toBeNull();
  });

  it('silent honeypot: returns 200 without sending email when website is filled', async () => {
    const formData = new FormData();
    formData.append('website', 'https://spam-bot.site');
    formData.append('email', 'spammer@bot.org');
    formData.append('fullName', 'Bot');
    formData.append('message', 'Buy meds');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Verified that Resend was never invoked
    expect(capturedPayload).toBeNull();
  });

  it('returns 400 when attachment is not a PDF MIME type', async () => {
    const formData = new FormData();
    formData.append('email', 'reader@example.com');
    formData.append('fullName', 'Xurxo');
    formData.append('message', 'Ola');

    const fakeTextFile = new File(['Hello text'], 'note.txt', { type: 'text/plain' });
    formData.append('file', fakeTextFile);

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_file');
    expect(capturedPayload).toBeNull();
  });

  it('returns 400 when file has pdf MIME type but invalid PDF magic header', async () => {
    const formData = new FormData();
    formData.append('email', 'reader@example.com');
    formData.append('fullName', 'Xurxo');
    formData.append('message', 'Ola');

    const spoofedFile = new File(['NOT_A_REAL_PDF_HEADER'], 'fake.pdf', { type: 'application/pdf' });
    formData.append('file', spoofedFile);

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_file');
    expect(capturedPayload).toBeNull();
  });

  it('returns 500 when RESEND_API_KEY is not configured', async () => {
    delete process.env.RESEND_API_KEY;

    const formData = new FormData();
    formData.append('email', 'reader@example.com');
    formData.append('fullName', 'Xurxo');
    formData.append('message', 'Ola');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('send_failed');
    expect(capturedPayload).toBeNull();
  });

  it('returns 502 when Resend API returns an error', async () => {
    mockSendResult = {
      data: null,
      error: {
        statusCode: 403,
        name: 'validation_error',
        message: 'You can only send testing emails to your own email address',
      },
    };

    const formData = new FormData();
    formData.append('email', 'reader@example.com');
    formData.append('fullName', 'Xurxo');
    formData.append('subject', 'Proposta');
    formData.append('message', 'Ola consello');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe('send_failed');
    expect(capturedPayload).not.toBeNull();
  });

  it('successfully delivers message with escaped HTML, replyTo, verified sender, and valid PDF attachment', async () => {
    const formData = new FormData();
    formData.append('email', 'investigador@universidade.gal');
    formData.append('fullName', '<script>alert("hack")</script>Rosalía');
    formData.append('subject', 'Artigo sobre economía & sociedade');
    formData.append('message', 'Liña 1\nLiña 2 <img src=x onerror=alert(1)>');

    // Create a real mock PDF with magic bytes %PDF-1.4
    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);
    const validPdfFile = new File([validPdfBytes], 'borrador.pdf', { type: 'application/pdf' });
    formData.append('file', validPdfFile);

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.id).toBe('email_test_123');

    // Verify payload passed to Resend
    expect(capturedPayload?.from).toBe('Cerna Contacto <contacto@cernapensamento.org>');
    expect(capturedPayload?.to).toEqual(['contacto@cernapensamento.org']);
    expect(capturedPayload?.replyTo).toBe('investigador@universidade.gal');
    expect(capturedPayload?.subject).toBe(
      '[Contacto] Artigo sobre economía & sociedade - <script>alert("hack")</script>Rosalía'
    );

    // Check HTML escaping (no raw script or img onerror tags in html)
    expect(capturedPayload?.html).toContain('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;Rosalía');
    expect(capturedPayload?.html).not.toContain('<script>');
    expect(capturedPayload?.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(capturedPayload?.html).not.toContain('<img src=x');

    // Check attachments
    expect(capturedPayload?.attachments?.length).toBe(1);
    expect(capturedPayload?.attachments?.[0].filename).toBe('borrador.pdf');
    expect(Buffer.isBuffer(capturedPayload?.attachments?.[0].content)).toBe(true);

    // Check text fallback presence
    expect(capturedPayload?.text).toContain('Nome: <script>alert("hack")</script>Rosalía');
    expect(capturedPayload?.text).toContain('Email: investigador@universidade.gal');
  });
});
