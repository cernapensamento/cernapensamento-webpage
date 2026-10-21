import { PUBLICATION_STATUSES } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SubscriberRecord {
  email: string;
  full_name?: string;
  nombre?: string;
}

export async function POST(request: NextRequest) {
  try {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error('WEBHOOK_SECRET is not set in environment variables');
    }

    // 1. Verificar el secreto del webhook de forma segura
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    let isValid = false;
    try {
      const { timingSafeEqual } = await import('crypto');
      const secretBuf = Buffer.from(WEBHOOK_SECRET || '');
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
    
    // 2. Verificar que sea una publicación nueva o un cambio a "published"
    const currentStatus = payload.record?.status || payload.record?.estado;
    const oldStatus = payload.old_record?.status || payload.old_record?.estado;

    const isInsert = payload.type === 'INSERT' && currentStatus === PUBLICATION_STATUSES.PUBLISHED;
    const isUpdate = payload.type === 'UPDATE' && 
                     oldStatus === PUBLICATION_STATUSES.DRAFT && 
                     currentStatus === PUBLICATION_STATUSES.PUBLISHED;

    if (!isInsert && !isUpdate) {
      return NextResponse.json({ message: 'No es un evento de publicación, ignorado.' }, { status: 200 });
    }

    const publication = payload.record;

    // 3. Conectar a Supabase usando Anon Key (la función RPC es Security Definer)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 4. Obtener la lista de suscriptores de forma segura
    const { data: suscriptores, error } = await supabase.rpc('get_subscribers_emails', {
      webhook_secret: WEBHOOK_SECRET
    });

    if (error || !suscriptores || suscriptores.length === 0) {
      console.error('Error obteniendo suscriptores:', error);
      return NextResponse.json({ message: 'Sin suscriptores o error' }, { status: 200 });
    }

    // Extraer título y subtítulo soportando JSONB nuevo y columnas antiguas
    const title = publication.title?.es || publication.title?.gl || publication.titulo_es || publication.titulo_gl || 'Nueva publicación';
    const subtitle = publication.subtitle?.es || publication.subtitle?.gl || publication.subtitulo_es || publication.subtitulo_gl || '';

    // 5. Enviar el correo masivo con Resend
    const subList = suscriptores as SubscriberRecord[];
    const emailsToSend = subList.map((sub) => ({
      from: 'Cerna <boletin@cernapensamento.org>',
      to: [sub.email],
      subject: `Nueva publicación: ${title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1c1c;">
          <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 8px;">${title}</h1>
          <p style="font-size: 16px; color: #666; margin-bottom: 24px;">${subtitle}</p>
          <div style="margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/articulo/${publication.slug || publication.id}" style="background-color: #1a1a1a; color: #fbf9f8; padding: 12px 24px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
              Leer la publicación completa
            </a>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 48px;">
            Estás recibiendo este correo porque aceptaste recibir el boletín semanal de Cerna.
            Puedes cambiar esta preferencia desde tu perfil en cualquier momento.
          </p>
        </div>
      `
    }));

    const { data: resendData, error: resendError } = await resend.batch.send(emailsToSend.slice(0, 100));

    if (resendError) {
      console.error('Error enviando con Resend:', resendError);
      return NextResponse.json({ error: resendError }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: emailsToSend.length, resendData }, { status: 200 });

  } catch (error) {
    console.error('Error en el webhook:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
