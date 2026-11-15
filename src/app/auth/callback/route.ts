import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const origin = resolveRequestOrigin(request);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (isSafeRedirectPath(next, origin)) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const redirectPath = await resolvePostAuthRedirectPath(data.user, supabase);
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // URL to redirect to after sign in process fails
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
