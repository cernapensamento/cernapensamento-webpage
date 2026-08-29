import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;
    const subject = formData.get('subject') as string || 'Sin Asunto';
    const message = formData.get('message') as string;
    const file = formData.get('file') as File | null;
    
    if (!email || !fullName || !message) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    const attachments = [];
    if (file && file.size > 0) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'El archivo debe ser un PDF.' }, { status: 400 });
      }
      if (file.size > 3.5 * 1024 * 1024) {
        return NextResponse.json({ error: 'El archivo excede los 3.5MB permitidos.' }, { status: 400 });
      }
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      attachments.push({
        filename: file.name,
        content: buffer,
      });
    }

    await resend.emails.send({
      from: 'Cerna Contacto <onboarding@resend.dev>', 
      to: ['contacto@cernapensamento.org'],
      subject: `Nuevo mensaje: ${subject} - ${fullName}`,
      html: `
        <h2>Nuevo mensaje de ${fullName}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <h3>Mensaje:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in contact:', error);
    return NextResponse.json({ error: 'Error del servidor al enviar' }, { status: 500 });
  }
}
