import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'CERNA_WEBHOOK_SECRET_98765';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar el secreto del webhook
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await request.json();
    
    // 2. Verificar que sea una publicación nueva o un cambio a "publicado"
    const isInsert = payload.type === 'INSERT' && payload.record.estado === 'publicado';
    const isUpdate = payload.type === 'UPDATE' && 
                     payload.old_record.estado === 'borrador' && 
                     payload.record.estado === 'publicado';

    if (!isInsert && !isUpdate) {
      return NextResponse.json({ message: 'No es un evento de publicación, ignorado.' }, { status: 200 });
    }

    const articulo = payload.record;

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

    // 5. Enviar el correo masivo con Resend
    // Usamos Batch Emails para mayor eficiencia y no exceder límites de la API de Resend
    const emailsToSend = suscriptores.map((sub: { email: string, nombre: string }) => ({
      from: 'Cerna <boletin@cernapensamento.org>', // REEMPLAZAR POR TU DOMINIO VERIFICADO EN RESEND
      to: [sub.email],
      subject: `Nuevo artículo: ${articulo.titulo}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 8px;">${articulo.titulo}</h1>
          ${articulo.subtitulo ? `<h2 style="font-size: 18px; font-weight: normal; color: #666; margin-top: 0;">${articulo.subtitulo}</h2>` : ''}
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
          <p>Hola ${sub.nombre},</p>
          <p>Se acaba de publicar una nueva reflexión en Cerna que podría interesarte.</p>
          <div style="margin: 32px 0;">
            <a href="https://cernapensamento.org/articulo/${articulo.slug}" style="background-color: #1a1a1a; color: #fbf9f8; padding: 12px 24px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
              Leer el artículo completo
            </a>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 48px;">
            Estás recibiendo este correo porque aceptaste recibir el boletín semanal de Cerna.
            Puedes cambiar esta preferencia desde tu perfil en cualquier momento.
          </p>
        </div>
      `
    }));

    // Enviamos en lotes si hay muchos, pero para empezar podemos enviarlos de golpe
    // (Resend soporta hasta 100 correos por llamada a batch)
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
