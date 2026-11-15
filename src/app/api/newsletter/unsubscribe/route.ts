import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/dictionaries';
import { getDictionaryClient } from '@/dictionaries/client';
import { resolveLocale, type Locale } from '@/i18n-config';
import { unsubscribeNewsletterByEmail } from '@/lib/db';
import { renderUnsubscribeHtml } from '@/lib/email/newsletter-template';
import { verifyUnsubscribeToken, getSiteBaseUrl } from '@/lib/email/newsletter';

/**
 * Unsubscribes immediately using email/token query parameters and returns HTML
 * in the resolved locale (defaulting to Galician). Returns 400 for invalid
 * credentials, 200 when the RPC completes without error, or 500 for database
 * failures and caught exceptions. Dictionary loading errors propagate.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const lang: Locale = resolveLocale(searchParams.get('lang'));
  const siteUrl = getSiteBaseUrl();
  const dict = await getDictionary(lang);

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    const html = await renderUnsubscribeHtml({ email, lang, siteUrl, success: false, dict });
    return new NextResponse(html, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const { error } = await unsubscribeNewsletterByEmail(email);

    if (error) {
      console.error('[Newsletter Unsubscribe] RPC error:', error);
      const html = await renderUnsubscribeHtml({
        email,
        lang,
        siteUrl,
        success: false,
        errorMessage: dict.newsletter.unsubscribePage.dbErrorMessage,
        dict,
      });
      return new NextResponse(html, {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const html = await renderUnsubscribeHtml({ email, lang, siteUrl, success: true, dict });
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('[Newsletter Unsubscribe] Internal error:', err);
    const html = await renderUnsubscribeHtml({
      email,
      lang,
      siteUrl,
      success: false,
      errorMessage: dict.newsletter.unsubscribePage.internalErrorMessage,
      dict,
    });
    return new NextResponse(html, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

/**
 * Handles RFC 8058 one-click unsubscribe requests using email/token query
 * parameters, falling back to form fields for missing values. Invalid form
 * parsing is ignored. Returns localized JSON with 400 for invalid credentials,
 * 200 when the unsubscribe RPC completes without error, or 500 for database
 * failures and caught exceptions.
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang: Locale = resolveLocale(searchParams.get('lang'));
  const messages = getDictionaryClient(lang).newsletter.unsubscribePage;
  let email = searchParams.get('email') || '';
  let token = searchParams.get('token') || '';

  if (!email || !token) {
    try {
      const formData = await request.formData();
      email = email || (formData.get('email') as string) || '';
      token = token || (formData.get('token') as string) || '';
    } catch {
      // Body was not formData, ignore
    }
  }

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: messages.errorMessage }, { status: 400 });
  }

  try {
    const { error } = await unsubscribeNewsletterByEmail(email);

    if (error) {
      console.error('[Newsletter Unsubscribe POST] RPC error:', error);
      return NextResponse.json({ error: messages.dbErrorMessage }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: messages.successMessage.replace('{email}', email.trim().toLowerCase()),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Newsletter Unsubscribe POST] Internal error:', err);
    return NextResponse.json({ error: messages.internalErrorMessage }, { status: 500 });
  }
}
