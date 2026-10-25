import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Resend } from 'resend';
import { POST } from '../src/app/api/contact/route.ts';

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

    EmailsClass.prototype.send = async function (payload: MockSendPayload) {
      capturedPayload = payload;
      return mockSendResult;
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    EmailsClass.prototype.send = originalSend;
  });

  test('returns 400 when required fields are missing', async () => {
    const formData = new FormData();
    formData.append('email', 'reader@example.com');
    // fullName and message are missing

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'missing_fields');
    assert.equal(capturedPayload, null);
  });

  test('returns 400 when email format is invalid', async () => {
    const formData = new FormData();
    formData.append('email', 'not-an-email');
    formData.append('fullName', 'Xurxo');
    formData.append('message', 'Ola a todos');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'invalid_email');
    assert.equal(capturedPayload, null);
  });

  test('returns 400 when fields exceed maximum length', async () => {
    const formData = new FormData();
    formData.append('email', 'reader@example.com');
    formData.append('fullName', 'A'.repeat(201)); // max 200
    formData.append('message', 'Ola');

    const request = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'too_long');
    assert.equal(capturedPayload, null);
  });

  test('silent honeypot: returns 200 without sending email when website is filled', async () => {
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
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    // Verified that Resend was never invoked
    assert.equal(capturedPayload, null);
  });

  test('returns 400 when attachment is not a PDF MIME type', async () => {
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
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'invalid_file');
    assert.equal(capturedPayload, null);
  });

  test('returns 400 when file has pdf MIME type but invalid PDF magic header', async () => {
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
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'invalid_file');
    assert.equal(capturedPayload, null);
  });

  test('returns 500 when RESEND_API_KEY is not configured', async () => {
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
    assert.equal(res.status, 500);
    const data = await res.json();
    assert.equal(data.error, 'send_failed');
    assert.equal(capturedPayload, null);
  });

  test('returns 502 when Resend API returns an error', async () => {
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
    assert.equal(res.status, 502);
    const data = await res.json();
    assert.equal(data.error, 'send_failed');
    assert.notEqual(capturedPayload, null);
  });

  test('successfully delivers message with escaped HTML, replyTo, verified sender, and valid PDF attachment', async () => {
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
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.id, 'email_test_123');

    // Verify payload passed to Resend
    assert.equal(capturedPayload.from, 'Cerna Contacto <contacto@cernapensamento.org>');
    assert.deepEqual(capturedPayload.to, ['contacto@cernapensamento.org']);
    assert.equal(capturedPayload.replyTo, 'investigador@universidade.gal');
    assert.equal(capturedPayload.subject, '[Contacto] Artigo sobre economía & sociedade - <script>alert("hack")</script>Rosalía');

    // Check HTML escaping (no raw script or img onerror tags in html)
    assert.ok(capturedPayload.html.includes('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;Rosalía'));
    assert.ok(!capturedPayload.html.includes('<script>'));
    assert.ok(capturedPayload.html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(!capturedPayload.html.includes('<img src=x'));

    // Check attachments
    assert.equal(capturedPayload.attachments.length, 1);
    assert.equal(capturedPayload.attachments[0].filename, 'borrador.pdf');
    assert.ok(Buffer.isBuffer(capturedPayload.attachments[0].content));

    // Check text fallback presence
    assert.ok(capturedPayload.text.includes('Nome: <script>alert("hack")</script>Rosalía'));
    assert.ok(capturedPayload.text.includes('Email: investigador@universidade.gal'));
  });
});
