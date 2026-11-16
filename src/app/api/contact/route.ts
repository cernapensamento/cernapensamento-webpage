import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { resolveLocale } from '@/i18n-config';
import { renderContactEmail } from '@/lib/email/contact';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 200;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_FILE_SIZE = 3.5 * 1024 * 1024; // 3.5MB

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

    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
    }

    const formData = await request.formData();

    // 1. Silent Honeypot: If the hidden 'website' field is populated, trap spam bots silently.
    const honeypot = formData.get('website')?.toString();
    if (honeypot && honeypot.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    // 2. Extract and sanitize text fields
    const lang = resolveLocale(formData.get('lang')?.toString());
    const rawEmail = formData.get('email')?.toString() || '';
    const rawFullName = formData.get('fullName')?.toString() || '';
    const rawSubject = formData.get('subject')?.toString() || '';
    const rawMessage = formData.get('message')?.toString() || '';

    const email = rawEmail.trim();
    const fullName = rawFullName.trim();
    const subject = rawSubject.trim();
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
    let attachmentFile: { filename: string; content: Buffer } | null = null;

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

      attachmentFile = {
        filename: file.name,
        content: buffer,
      };
    }

    // 5. Sender and Recipient addresses
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Cerna Contacto <contacto@cernapensamento.org>';
    const toEmail = process.env.CONTACT_TO_EMAIL || 'contacto@cernapensamento.org';

    // 6. Safe HTML & Text Content Generation
    const renderedEmail = renderContactEmail({
      fullName,
      email,
      subject,
      message,
      lang,
    });

    const attachments = attachmentFile
      ? [
          {
            filename: attachmentFile.filename || renderedEmail.defaultAttachmentName,
            content: attachmentFile.content,
          },
        ]
      : undefined;

    // 7. Dispatch via Resend
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: renderedEmail.subject,
      html: renderedEmail.html,
      text: renderedEmail.text,
      attachments,
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
