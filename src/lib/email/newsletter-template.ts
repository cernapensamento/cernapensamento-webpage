/**
 * Editorial HTML Email Template for Cerna Pensamento
 * Compliant with major email clients (Gmail, Apple Mail, Outlook, Thunderbird)
 * Uses table layout, inline styles, responsive meta tags, and Cerna brand tokens.
 * Backed strictly by centralized dictionaries (src/dictionaries/{gl,es}.json).
 */

import { getDictionaryClient } from '@/dictionaries/client';

export interface NewsletterEmailProps {
  title: string;
  subtitle?: string | null;
  authorName?: string | null;
  coverImageUrl?: string | null;
  articleUrl: string;
  profileUrl: string;
  unsubscribeUrl: string;
  lang: 'gl' | 'es';
  publicationType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict?: any;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderNewsletterEmail(props: NewsletterEmailProps): { html: string; text: string; subject: string } {
  const {
    title,
    subtitle,
    authorName,
    coverImageUrl,
    articleUrl,
    profileUrl,
    unsubscribeUrl,
    lang,
    publicationType,
    dict,
  } = props;

  const dictionary = dict || getDictionaryClient(lang);
  const emailDict = dictionary.newsletter.email;

  const cleanTitle = title?.trim() || emailDict.defaultTitle;
  const safeTitle = escapeHtml(cleanTitle);
  const safeSubtitle = subtitle?.trim() ? escapeHtml(subtitle.trim()) : null;
  const safeAuthor = authorName?.trim() ? escapeHtml(authorName.trim()) : null;

  const subject = `${emailDict.subjectPrefix}${cleanTitle}`;

  const typeKey = publicationType?.toLowerCase();
  const localizedType = typeKey && emailDict.types?.[typeKey] ? emailDict.types[typeKey] : null;
  const badgeText = localizedType || (publicationType ? publicationType.toUpperCase() : emailDict.defaultBadge);

  const brandLabel = emailDict.brand;
  const readButtonLabel = emailDict.readButton;
  const bylineLabel = emailDict.byline;
  const footerNote = emailDict.footerNote;
  const manageLabel = emailDict.managePreferences;
  const unsubscribeLabel = emailDict.unsubscribe;

  const plainText = [
    brandLabel,
    '================',
    '',
    badgeText,
    cleanTitle,
    safeAuthor ? `${bylineLabel} ${authorName}` : '',
    subtitle ? `\n${subtitle}\n` : '',
    '',
    `${readButtonLabel}: ${articleUrl}`,
    '',
    '----------------',
    footerNote,
    `${manageLabel}: ${profileUrl}`,
    `${unsubscribeLabel}: ${unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${safeTitle}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #fbf9f8; color: #1c1c1c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 16px !important; }
      .content-card { padding: 24px 20px !important; }
      .heading-title { font-size: 24px !important; line-height: 32px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fbf9f8;">
  <center style="width: 100%; background-color: #fbf9f8; padding: 32px 0 48px 0;">
    <!-- Container -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;" class="container">
      
      <!-- Brand Header -->
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <a href="${escapeHtml(articleUrl)}" target="_blank" style="text-decoration: none;">
            <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; letter-spacing: 4px; text-transform: uppercase; color: #c5a059; font-weight: 600;">
              ${escapeHtml(brandLabel)}
            </span>
          </a>
        </td>
      </tr>

      <!-- Main Card -->
      <tr>
        <td style="background-color: #ffffff; border: 1px solid #e7e2db; border-radius: 2px; padding: 40px 36px;" class="content-card">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            
            <!-- Type / Category Badge -->
            <tr>
              <td style="padding-bottom: 14px;">
                <span style="display: inline-block; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #8c827a; font-weight: 600;">
                  ${badgeText}
                </span>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="padding-bottom: 12px;">
                <h1 class="heading-title" style="margin: 0; font-family: Georgia, 'Libre Caslon Text', 'Times New Roman', serif; font-size: 28px; line-height: 36px; font-weight: normal; color: #1c1c1c;">
                  <a href="${escapeHtml(articleUrl)}" target="_blank" style="color: #1c1c1c; text-decoration: none;">
                    ${safeTitle}
                  </a>
                </h1>
              </td>
            </tr>

            <!-- Author Byline -->
            ${
              safeAuthor
                ? `<tr>
              <td style="padding-bottom: 20px;">
                <span style="font-size: 14px; color: #766e65; font-style: italic; font-family: Georgia, serif;">
                  ${bylineLabel} <strong style="font-style: normal; font-weight: 600; color: #2d2926;">${safeAuthor}</strong>
                </span>
              </td>
            </tr>`
                : ''
            }

            <!-- Cover Image (if available) -->
            ${
              coverImageUrl
                ? `<tr>
              <td style="padding-bottom: 24px;">
                <a href="${escapeHtml(articleUrl)}" target="_blank" style="display: block; text-decoration: none;">
                  <img src="${escapeHtml(coverImageUrl)}" alt="${safeTitle}" width="528" style="width: 100%; max-width: 528px; height: auto; display: block; border-radius: 2px; border: 1px solid #f0ece6;" />
                </a>
              </td>
            </tr>`
                : ''
            }

            <!-- Subtitle / Summary -->
            ${
              safeSubtitle
                ? `<tr>
              <td style="padding-bottom: 28px;">
                <p style="margin: 0; font-size: 16px; line-height: 26px; color: #4a453e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  ${safeSubtitle}
                </p>
              </td>
            </tr>`
                : ''
            }

            <!-- Action Button -->
            <tr>
              <td align="left" style="padding-top: 8px; padding-bottom: 12px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="background-color: #1c1c1c; border-radius: 2px;">
                      <a href="${escapeHtml(articleUrl)}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #fbf9f8; text-decoration: none;">
                        ${readButtonLabel} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>

      <!-- Footer Info -->
      <tr>
        <td style="padding-top: 32px; padding-bottom: 12px; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 18px; color: #9c948a;">
            ${footerNote}
          </p>
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9c948a;">
            <a href="${escapeHtml(profileUrl)}" target="_blank" style="color: #766e65; text-decoration: underline;">
              ${manageLabel}
            </a>
            &nbsp;&nbsp;&bull;&nbsp;&nbsp;
            <a href="${escapeHtml(unsubscribeUrl)}" target="_blank" style="color: #766e65; text-decoration: underline;">
              ${unsubscribeLabel}
            </a>
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;

  return { html, text: plainText, subject };
}

export interface UnsubscribePageProps {
  email: string;
  lang: 'gl' | 'es';
  siteUrl: string;
  success: boolean;
  errorMessage?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict?: any;
}

/**
 * Renders the standalone HTML confirmation view for GET /api/newsletter/unsubscribe.
 * Strictly backed by centralized dictionaries (src/dictionaries/{gl,es}.json).
 */
export function renderUnsubscribeHtml(props: UnsubscribePageProps): string {
  const { email, lang, siteUrl, success, errorMessage, dict } = props;
  const dictionary = dict || getDictionaryClient(lang);
  const pageDict = dictionary.newsletter.unsubscribePage;

  const safeEmail = escapeHtml(email);
  const title = success ? pageDict.successTitle : pageDict.errorTitle;
  const heading = success ? pageDict.successHeading : pageDict.errorHeading;

  const message = success
    ? pageDict.successMessage.replace('{email}', `<strong>${safeEmail}</strong>`)
    : (errorMessage || pageDict.errorMessage);

  const homeLabel = pageDict.returnHome;
  const profileLabel = pageDict.manageProfile;
  const brandLabel = pageDict.brand;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #fbf9f8;
      color: #1c1c1c;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e5e0d8;
      max-width: 520px;
      margin: 24px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      text-align: center;
    }
    .brand {
      font-family: Georgia, serif;
      font-size: 14px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #c5a059;
      margin-bottom: 24px;
      display: inline-block;
    }
    h1 {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: normal;
      margin: 0 0 16px 0;
      color: #1c1c1c;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #555555;
      margin: 0 0 32px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #1c1c1c;
      color: #fbf9f8;
      text-decoration: none;
      font-size: 13px;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn:hover {
      background-color: #c5a059;
    }
    .secondary-link {
      display: block;
      margin-top: 18px;
      font-size: 13px;
      color: #888888;
      text-decoration: none;
    }
    .secondary-link:hover {
      color: #1c1c1c;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="brand">${escapeHtml(brandLabel)}</span>
    <h1>${escapeHtml(heading)}</h1>
    <p>${message}</p>
    <a href="${escapeHtml(siteUrl)}/${lang}" class="btn">${escapeHtml(homeLabel)}</a>
    <a href="${escapeHtml(siteUrl)}/${lang}/escritorio/perfil" class="secondary-link">${escapeHtml(profileLabel)}</a>
  </div>
</body>
</html>`;
}
