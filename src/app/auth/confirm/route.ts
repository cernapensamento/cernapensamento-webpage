import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolvePostAuthRedirectPath, resolveRequestOrigin } from '@/lib/auth';

function isSafeRedirectPath(next: string | null, origin: string): next is string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return false;
  }
  try {
    return new URL(next, origin).origin === origin;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');
  const origin = resolveRequestOrigin(request);

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      if (isSafeRedirectPath(next, origin)) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const redirectPath = await resolvePostAuthRedirectPath(user, supabase);
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }

      return NextResponse.redirect(`${origin}/escritorio/perfil`);
    }
  }

  // Si el usuario ya está autenticado (p. ej. inició sesión manualmente antes de abrir el correo),
  // enviarlo directamente a su escritorio en lugar de un error
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const redirectPath = await resolvePostAuthRedirectPath(user, supabase);
    return NextResponse.redirect(`${origin}${redirectPath}`);
  }

  // Redirigir a login con parámetro de error en lugar de la ruta inexistente /auth/auth-error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

