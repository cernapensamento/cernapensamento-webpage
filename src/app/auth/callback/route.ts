import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  const next = searchParams.get('next')

  // Obtener el host real cuando estamos detrás de un proxy (Cloudflare Tunnel)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      if (next && next.startsWith('/') && !next.startsWith('//')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Get user profile to determine role
      const jwtRole = data.user.app_metadata?.user_role;
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
        
      const role = jwtRole || profile?.role;
      const canAccessDesk = role === 'founder' || role === 'admin' || role === 'member' || role === 'escritor';
      const redirectPath = canAccessDesk ? '/escritorio' : '/escritorio/perfil';
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // URL to redirect to after sign in process fails
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
