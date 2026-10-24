import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { getDictionary } from '@/dictionaries';
import { DB_TABLES, PUBLICATION_COLS, PUBLICATION_STATUSES, USER_COLS } from '@/lib/db/schema';
import { renderNewsletterEmail } from '@/lib/email/newsletter-template';
import { getNewsletterSecret, buildUnsubscribeUrl, getSiteBaseUrl } from '@/utils/newsletter';

interface SubscriberRecord {
  email: string;
  full_name?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const WEBHOOK_SECRET = getNewsletterSecret();

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
    const currentStatus = publication.status || publication.estado;
    if (currentStatus !== PUBLICATION_STATUSES.PUBLISHED) {
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

    // 3. Connect to Supabase using Service Role Key (preferred for admin updates) or Anon Key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Atomically claim this publication dispatch: set newsletter_sent_at = now() WHERE newsletter_sent_at IS NULL
    const nowIso = new Date().toISOString();
    const { data: claimedPublication, error: claimError } = await supabase
      .from(DB_TABLES.PUBLICATIONS)
      .update({ [PUBLICATION_COLS.NEWSLETTER_SENT_AT]: nowIso })
      .eq(PUBLICATION_COLS.ID, publication.id)
      .is(PUBLICATION_COLS.NEWSLETTER_SENT_AT, null)
      .select('*')
      .maybeSingle();

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

    // 5. Fetch Author Information (full_name) if available
    let authorName: string | null = null;
    if (claimedPublication.author_id) {
      const { data: authorData } = await supabase
        .from(DB_TABLES.USERS)
        .select(USER_COLS.FULL_NAME)
        .eq(USER_COLS.ID, claimedPublication.author_id)
        .maybeSingle();

      if (authorData && authorData.full_name) {
        authorName = authorData.full_name;
      }
    }

    // 6. Fetch Active Subscribers via RPC
    const { data: rawSubscribers, error: subError } = await supabase.rpc('get_subscribers_emails', {
      webhook_secret: WEBHOOK_SECRET,
    });

    if (subError) {
      console.error('[Newsletter Webhook] Error fetching subscribers:', subError);
      return NextResponse.json({ error: 'Erro ao obter a lista de subscritores' }, { status: 500 });
    }

    const subscribers = (rawSubscribers || []) as SubscriberRecord[];
    if (subscribers.length === 0) {
      return NextResponse.json(
        { message: 'Non hai subscritores activos para notificar.', count: 0 },
        { status: 200 }
      );
    }

    // 7. Resolve Metadata & Editorial Strings
    const originalLang = claimedPublication.original_language || 'gl';
    const primaryLang = (originalLang === 'es' ? 'es' : 'gl') as 'gl' | 'es';
    const fallbackLang = primaryLang === 'gl' ? 'es' : 'gl';
    const dict = await getDictionary(primaryLang);

    const title =
      claimedPublication.title?.[primaryLang] ||
      claimedPublication.title?.[fallbackLang] ||
      claimedPublication.titulo_gl ||
      claimedPublication.titulo_es ||
      dict.newsletter.email.defaultTitle;

    const subtitle =
      claimedPublication.subtitle?.[primaryLang] ||
      claimedPublication.subtitle?.[fallbackLang] ||
      claimedPublication.subtitulo_gl ||
      claimedPublication.subtitulo_es ||
      null;

    const siteUrl = getSiteBaseUrl();
    const articleSlug = claimedPublication.slug || claimedPublication.id;
    const articleUrl = `${siteUrl}/${primaryLang}/articulo/${articleSlug}`;
    const profileUrl = `${siteUrl}/${primaryLang}/escritorio/perfil`;
    const coverImageUrl = claimedPublication.cover_image_url || null;
    const publicationType = claimedPublication.type || 'artigo';

    // 8. Prepare Email List with Personalized 1-Click Unsubscribe & RFC 8058 Headers
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[Newsletter Webhook] RESEND_API_KEY is missing');
      return NextResponse.json({ error: 'Configuración de correo (Resend) non dispoñible' }, { status: 500 });
    }
    const resend = new Resend(resendApiKey);

    const emailBatch = subscribers.map((sub) => {
      const userUnsubscribeUrl = buildUnsubscribeUrl(sub.email, primaryLang);
      const emailContent = renderNewsletterEmail({
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
    });

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
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
