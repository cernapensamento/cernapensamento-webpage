/**
 * Editorial Email & Unsubscribe Templates for Cerna Pensamento
 * Powered by React Email and Tailwind CSS.
 * Backed strictly by centralized dictionaries (src/dictionaries/{gl,es}.json).
 */

import React from 'react';
import { render } from '@react-email/components';
import { getDictionaryClient } from '@/dictionaries/client';
import { NewsletterEmail, type NewsletterEmailProps } from './NewsletterEmail';
import { UnsubscribePage, type UnsubscribePageProps } from './UnsubscribePage';

export { NewsletterEmail, type NewsletterEmailProps };
export { UnsubscribePage, type UnsubscribePageProps };

/**
 * Builds localized HTML, plain text, and subject for a publication notification using React Email.
 * Uses `dict` when provided, otherwise the locale's client dictionary, and falls
 * back to the dictionary title when the supplied title is blank.
 */
export async function renderNewsletterEmail(
  props: NewsletterEmailProps
): Promise<{ html: string; text: string; subject: string }> {
  const {
    title,
    subtitle,
    authorName,
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
  const cleanSubtitle = subtitle?.trim() || null;
  const cleanAuthor = authorName?.trim() || null;

  const subject = `${emailDict.subjectPrefix}${cleanTitle}`;

  const typeKey = publicationType?.toLowerCase();
  const typeMap = emailDict.types as Record<string, string> | undefined;
  const localizedType = typeKey && typeMap?.[typeKey] ? typeMap[typeKey] : null;
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
    cleanAuthor ? `${bylineLabel} ${cleanAuthor}` : '',
    cleanSubtitle ? `\n${cleanSubtitle}\n` : '',
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

  const element = React.createElement(NewsletterEmail, props);
  const html = await render(element);

  return { html, text: plainText, subject };
}

/**
 * Renders the standalone HTML confirmation view for GET /api/newsletter/unsubscribe using React Email.
 * Backed strictly by centralized dictionaries (src/dictionaries/{gl,es}.json).
 */
export async function renderUnsubscribeHtml(props: UnsubscribePageProps): Promise<string> {
  const element = React.createElement(UnsubscribePage, props);
  return await render(element);
}
