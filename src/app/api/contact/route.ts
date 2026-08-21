import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;
    const subject = formData.get('subject') as string || 'Sin Asunto';
    const message = formData.get('message') as string;
    
    if (!email || !fullName || !message) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'Cerna Contacto <onboarding@resend.dev>', 
      to: ['contacto@cernapensamento.org'],
      subject: `Nuevo mensaje de Contacto: ${subject}`,
      html: `
        <h2>Nuevo mensaje de ${fullName}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <h3>Mensaje:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in contact:', error);
    return NextResponse.json({ error: 'Error del servidor al enviar' }, { status: 500 });
  }
}
