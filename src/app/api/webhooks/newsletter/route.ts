import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getDictionary } from '@/dictionaries';
import { resolveLocale, type Locale } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import {
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  createNewsletterSupabaseClient,
  claimPublicationForNewsletter,
  releasePublicationNewsletterClaim,
  getNewsletterAuthorName,
  getNewsletterSubscribers,
} from '@/lib/db';
import { renderNewsletterEmail } from '@/lib/email/newsletter-template';
import { getNewsletterSecret, buildUnsubscribeUrl, getSiteBaseUrl } from '@/lib/email/newsletter';

/**
 * Authorizes a publication webhook with a Bearer secret, claims an unsent record
 * for a published event, and sends subscriber emails in batches of at most 100.
 * The claim writes newsletter_sent_at before sending and is retained on failures.
 * Returns JSON with 401 for failed authorization, 400 for a missing record ID,
 * 500 for setup/database failures or outer exceptions, and 200 for ignored events
 * or completed batch attempts. Individual batch failures remain in the 200 results;
 * `success: true` does not mean every email was sent.
 */
export async function POST(request: NextRequest) {
  let supabase: SupabaseClient | null = null;
  let claimedPublicationId: string | null = null;

  try {
    let WEBHOOK_SECRET: string;
    try {
      WEBHOOK_SECRET = getNewsletterSecret();
    } catch {
      console.error('[Newsletter Webhook] Missing WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Configuración non dispoñible' }, { status: 500 });
    }

    // 1. Verify Authorization Header (Bearer WEBHOOK_SECRET) with timing-safe comparison
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1] || '';

    let isValid = false;
    try {
      const { timingSafeEqual } = await import('crypto');
      const secretBuf = Buffer.from(WEBHOOK_SECRET);
      const tokenBuf = Buffer.from(token);
      if (secretBuf.length === tokenBuf.length) {
        isValid = timingSafeEqual(secretBuf, tokenBuf);
      }
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await request.json();
    const publication = payload.record;

    if (!publication || !publication.id) {
      return NextResponse.json({ error: 'Payload de publicación inválido' }, { status: 400 });
    }

    // 2. Verify publication status: must be transition to or insert of 'published'
    if (publication.status !== PUBLICATION_STATUSES.PUBLISHED) {
      return NextResponse.json(
        { message: 'Non é un evento de publicación activa, ignorado.' },
        { status: 200 }
      );
    }

    // Quick check if payload already has newsletter_sent_at
    if (publication.newsletter_sent_at) {
      return NextResponse.json(
        { message: 'Esta publicación xa foi notificada previamente aos subscritores.' },
        { status: 200 }
      );
    }

    // 3. Validate credentials before claiming publication
    const resendApiKey = process.env.RESEND_API_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!resendApiKey || !serviceKey || !supabaseUrl) {
      console.error('[Newsletter Webhook] Missing RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json({ error: 'Configuración non dispoñible' }, { status: 500 });
    }

    supabase = createNewsletterSupabaseClient(true);
    const resend = new Resend(resendApiKey);

    // 4. Atomically claim this publication dispatch: set newsletter_sent_at = now() WHERE newsletter_sent_at IS NULL
    const { data: claimedPublication, error: claimError } = await claimPublicationForNewsletter(
      publication.id,
      supabase
    );

    if (claimError) {
      console.error('[Newsletter Webhook] Claim update error:', claimError);
      return NextResponse.json({ error: 'Erro ao bloquear o estado da publicación' }, { status: 500 });
    }

    // If no row was returned, another concurrent webhook worker already claimed it
    if (!claimedPublication) {
      return NextResponse.json(
        { message: 'A publicación xa foi reclamada ou enviada por outro proceso concorrente.' },
        { status: 200 }
      );
    }

    claimedPublicationId = claimedPublication.id;

    const releaseClaim = async () => {
      if (!supabase || !claimedPublicationId) return;
      try {
        await releasePublicationNewsletterClaim(claimedPublicationId, supabase);
      } catch (releaseErr) {
        console.error('[Newsletter Webhook] Erro ao liberar o bloqueo da publicación:', releaseErr);
      }
    };

    // 5. Fetch Author Information (full_name) if available
    const authorName = claimedPublication.author_id
      ? await getNewsletterAuthorName(claimedPublication.author_id, supabase)
      : null;

    // 6. Fetch Active Subscribers via RPC
    const { data: subscribers, error: subError } = await getNewsletterSubscribers(
      WEBHOOK_SECRET,
      supabase
    );

    if (subError) {
      console.error('[Newsletter Webhook] Error fetching subscribers:', subError);
      await releaseClaim();
      return NextResponse.json({ error: 'Erro ao obter a lista de subscritores' }, { status: 500 });
    }

    if (subscribers.length === 0) {
      return NextResponse.json(
        { message: 'Non hai subscritores activos para notificar.', count: 0 },
        { status: 200 }
      );
    }

    // 7. Resolve Metadata & Editorial Strings
    const primaryLang: Locale = resolveLocale(claimedPublication.original_language);
    const dict = await getDictionary(primaryLang);

    const title =
      resolveLocalizedText(claimedPublication.title, primaryLang) ||
      dict.newsletter.email.defaultTitle;

    const subtitle =
      resolveLocalizedText(claimedPublication.subtitle, primaryLang) || null;

    const siteUrl = getSiteBaseUrl();
    const articleSlug = claimedPublication.slug || claimedPublication.id;
    const articleUrl = `${siteUrl}/${primaryLang}/articulo/${articleSlug}`;
    const profileUrl = `${siteUrl}/${primaryLang}/escritorio/perfil`;
    const coverImageUrl = claimedPublication.cover_image_url || null;
    const publicationType = claimedPublication.type || PUBLICATION_TYPES.ARTICLE;

    // 8. Prepare Email List with Personalized 1-Click Unsubscribe & RFC 8058 Headers
    const emailBatch = await Promise.all(
      subscribers.map(async (sub) => {
        const userUnsubscribeUrl = buildUnsubscribeUrl(sub.email, primaryLang);
        const emailContent = await renderNewsletterEmail({
          title,
          subtitle,
          authorName,
          coverImageUrl,
          articleUrl,
          profileUrl,
          unsubscribeUrl: userUnsubscribeUrl,
          lang: primaryLang,
          publicationType,
          dict,
        });

        return {
          from: 'Cerna <boletin@cernapensamento.org>',
          to: [sub.email],
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          headers: {
            'List-Unsubscribe': `<${userUnsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        };
      })
    );

    // 9. Send in Chunks of 100 (Resend batch limit is 100 items per request)
    const CHUNK_SIZE = 100;
    const results = [];
    let successfulDispatches = 0;

    for (let i = 0; i < emailBatch.length; i += CHUNK_SIZE) {
      const chunk = emailBatch.slice(i, i + CHUNK_SIZE);
      try {
        const { data: resendData, error: resendError } = await resend.batch.send(chunk);
        if (resendError) {
          console.error(`[Newsletter Webhook] Resend batch error at chunk ${i / CHUNK_SIZE}:`, resendError);
          results.push({ chunkIndex: i / CHUNK_SIZE, error: resendError });
        } else {
          successfulDispatches += chunk.length;
          results.push({ chunkIndex: i / CHUNK_SIZE, success: true, count: chunk.length, data: resendData });
        }
      } catch (chunkErr) {
        console.error(`[Newsletter Webhook] Batch exception at chunk ${i / CHUNK_SIZE}:`, chunkErr);
        results.push({ chunkIndex: i / CHUNK_SIZE, error: String(chunkErr) });
      }
    }

    if (successfulDispatches === 0) {
      console.error('[Newsletter Webhook] Ningún correo foi enviado correctamente. Liberando claim.');
      await releaseClaim();
      return NextResponse.json(
        {
          error: 'Non se puido enviar ningún correo da newsletter',
          totalSubscribers: emailBatch.length,
          successfulDispatches: 0,
          results,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        publicationId: claimedPublication.id,
        totalSubscribers: emailBatch.length,
        successfulDispatches,
        batchCount: Math.ceil(emailBatch.length / CHUNK_SIZE),
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Newsletter Webhook] Erro crítico non controlado:', error);
    if (supabase && claimedPublicationId) {
      try {
        await releasePublicationNewsletterClaim(claimedPublicationId, supabase);
      } catch (releaseErr) {
        console.error('[Newsletter Webhook] Erro ao liberar o bloqueo tras excepción:', releaseErr);
      }
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
