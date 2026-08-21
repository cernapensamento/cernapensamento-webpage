import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;
    const abstract = formData.get('abstract') as string;
    
    // 1. Validaciones
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Debe ser un archivo PDF válido.' }, { status: 400 });
    }
    if (file.size > 3.5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede los 3.5MB permitidos.' }, { status: 400 });
    }

    // 2. Transformar el archivo a Buffer en RAM
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Enviar el correo con el adjunto in-memory
    await resend.emails.send({
      from: 'Cerna <onboarding@resend.dev>', // Should be a verified domain in production
      to: ['contacto@cernapensamento.org'],
      subject: `Nueva Propuesta de Artículo de ${fullName}`,
      html: `
        <h2>Nueva propuesta de artículo</h2>
        <p><strong>Autor:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <h3>Resumen:</h3>
        <p>${abstract}</p>
      `,
      attachments: [
        {
          filename: file.name,
          content: buffer,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in submit-article:', error);
    return NextResponse.json({ error: 'Error del servidor al enviar' }, { status: 500 });
  }
}
