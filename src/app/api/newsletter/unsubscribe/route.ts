import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDictionary } from '@/dictionaries';
import { renderUnsubscribeHtml } from '@/lib/email/newsletter-template';
import { verifyUnsubscribeToken, getSiteBaseUrl } from '@/lib/email/newsletter';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GET: Handles user clicking the unsubscribe link in the email footer.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const lang = (searchParams.get('lang') === 'es' ? 'es' : 'gl') as 'gl' | 'es';
  const siteUrl = getSiteBaseUrl();
  const dict = await getDictionary(lang);

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    const html = renderUnsubscribeHtml({ email, lang, siteUrl, success: false, dict });
    return new NextResponse(html, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('unsubscribe_newsletter_by_email', {
      target_email: email.trim().toLowerCase(),
    });

    if (error) {
      console.error('[Newsletter Unsubscribe] RPC error:', error);
      const html = renderUnsubscribeHtml({
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

    const html = renderUnsubscribeHtml({ email, lang, siteUrl, success: true, dict });
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('[Newsletter Unsubscribe] Internal error:', err);
    const html = renderUnsubscribeHtml({
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
 * POST: Handles RFC 8058 One-Click automated unsubscribe requests from email clients (Gmail/Yahoo).
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
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
    return NextResponse.json({ error: 'Invalid or missing unsubscribe token' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('unsubscribe_newsletter_by_email', {
      target_email: email.trim().toLowerCase(),
    });

    if (error) {
      console.error('[Newsletter Unsubscribe POST] RPC error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Unsubscribed successfully' }, { status: 200 });
  } catch (err) {
    console.error('[Newsletter Unsubscribe POST] Internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
