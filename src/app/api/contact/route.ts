import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 200;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_FILE_SIZE = 3.5 * 1024 * 1024; // 3.5MB

/**
 * Escapes ampersands, angle brackets, and quotes in contact fields for email HTML.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates multipart contact fields and sends the message through Resend.
 * Requires email, fullName, and message; subject defaults when blank. An optional
 * PDF must have the PDF MIME type and header and be at most 3.5 MiB.
 * With mail configuration present, a populated website honeypot returns success
 * without sending. Returns JSON: 200 on success, 400 for invalid fields/files,
 * 502 for a returned mail provider error, or 500 for missing configuration or
 * caught exceptions.
 */
export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[Contact API] RESEND_API_KEY is not configured');
      return NextResponse.json({ error: 'send_failed' }, { status: 500 });
    }

    const formData = await request.formData();

    // 1. Silent Honeypot: If the hidden 'website' field is populated, trap spam bots silently.
    const honeypot = formData.get('website')?.toString();
    if (honeypot && honeypot.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    // 2. Extract and sanitize text fields
    const rawEmail = formData.get('email')?.toString() || '';
    const rawFullName = formData.get('fullName')?.toString() || '';
    const rawSubject = formData.get('subject')?.toString() || '';
    const rawMessage = formData.get('message')?.toString() || '';

    const email = rawEmail.trim();
    const fullName = rawFullName.trim();
    const subject = rawSubject.trim() || 'Sin Asunto';
    const message = rawMessage.trim();

    // 3. Validation
    if (!email || !fullName || !message) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }

    if (
      fullName.length > MAX_NAME_LENGTH ||
      subject.length > MAX_SUBJECT_LENGTH ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json({ error: 'too_long' }, { status: 400 });
    }

    // 4. File Attachment Validation
    const file = formData.get('file') as File | null;
    const attachments = [];

    if (file && file.size > 0) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'invalid_file' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Verify PDF magic header bytes (%PDF-)
      const isPdfHeader = buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
      if (!isPdfHeader) {
        return NextResponse.json({ error: 'invalid_file' }, { status: 400 });
      }

      attachments.push({
        filename: file.name || 'documento.pdf',
        content: buffer,
      });
    }

    // 5. Sender and Recipient addresses
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Cerna Contacto <contacto@cernapensamento.org>';
    const toEmail = process.env.CONTACT_TO_EMAIL || 'contacto@cernapensamento.org';

    // 6. Safe HTML & Text Content Generation
    const escapedFullName = escapeHtml(fullName);
    const escapedEmail = escapeHtml(email);
    const escapedSubject = escapeHtml(subject);
    const escapedMessage = escapeHtml(message).replace(/\n/g, '<br>');

    const htmlBody = `
      <h2>Novo contacto recibido a través do formulario de Cerna</h2>
      <p><strong>Nome:</strong> ${escapedFullName}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapedEmail}">${escapedEmail}</a></p>
      <p><strong>Asunto:</strong> ${escapedSubject}</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <h3>Mensaxe:</h3>
      <p style="white-space: pre-wrap; font-family: sans-serif; line-height: 1.6;">${escapedMessage}</p>
    `;

    const textBody = `Novo contacto recibido a través do formulario de Cerna

Nome: ${fullName}
Email: ${email}
Asunto: ${subject}

Mensaxe:
${message}
`;

    // 7. Dispatch via Resend
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: `[Contacto] ${subject} - ${fullName}`,
      html: htmlBody,
      text: textBody,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (error) {
      console.error('[Contact API] Resend email send error:', error);
      return NextResponse.json({ error: 'send_failed' }, { status: 502 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('[Contact API] Unexpected error in contact route:', error);
    return NextResponse.json({ error: 'send_failed' }, { status: 500 });
  }
}
