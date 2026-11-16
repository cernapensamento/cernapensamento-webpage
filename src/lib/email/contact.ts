import { getDictionaryClient } from '@/dictionaries/client';
import { resolveLocale } from '@/i18n-config';

/**
 * Escapes ampersands, angle brackets, and quotes in contact fields for email HTML.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ContactEmailInput {
  fullName: string;
  email: string;
  subject?: string;
  message: string;
  lang?: string | null;
}

export interface RenderedContactEmail {
  subject: string;
  html: string;
  text: string;
  defaultAttachmentName: string;
}

/**
 * Renders HTML and plain-text payloads for internal contact form emails
 * using localized dictionary labels with fallback to the default locale.
 */
export function renderContactEmail({
  fullName,
  email,
  subject,
  message,
  lang,
}: ContactEmailInput): RenderedContactEmail {
  const locale = resolveLocale(lang);
  const emailDict = getDictionaryClient(locale).contactEmail;

  const cleanFullName = fullName.trim();
  const cleanEmail = email.trim();
  const cleanSubject = subject?.trim() || emailDict.defaultSubject;
  const cleanMessage = message.trim();

  const escapedFullName = escapeHtml(cleanFullName);
  const escapedEmail = escapeHtml(cleanEmail);
  const escapedSubject = escapeHtml(cleanSubject);
  const escapedMessage = escapeHtml(cleanMessage).replace(/\n/g, '<br>');

  const html = `
      <h2>${escapeHtml(emailDict.heading)}</h2>
      <p><strong>${escapeHtml(emailDict.nameLabel)}:</strong> ${escapedFullName}</p>
      <p><strong>${escapeHtml(emailDict.emailLabel)}:</strong> <a href="mailto:${escapedEmail}">${escapedEmail}</a></p>
      <p><strong>${escapeHtml(emailDict.subjectLabel)}:</strong> ${escapedSubject}</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <h3>${escapeHtml(emailDict.messageLabel)}:</h3>
      <p style="white-space: pre-wrap; font-family: sans-serif; line-height: 1.6;">${escapedMessage}</p>
    `;

  const text = `${emailDict.heading}

${emailDict.nameLabel}: ${cleanFullName}
${emailDict.emailLabel}: ${cleanEmail}
${emailDict.subjectLabel}: ${cleanSubject}

${emailDict.messageLabel}:
${cleanMessage}
`;

  return {
    subject: `${emailDict.subjectPrefix} ${cleanSubject} - ${cleanFullName}`,
    html,
    text,
    defaultAttachmentName: emailDict.defaultAttachmentName,
  };
}
