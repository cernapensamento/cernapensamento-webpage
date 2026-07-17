import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  // Obtener el host real cuando estamos detrás de un proxy (Cloudflare Tunnel)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', data.user.id)
        .single();
        
      const rol = profile?.rol;
      const redirectPath = (rol === 'escritor' || rol === 'admin') ? '/escritorio' : '/escritorio/perfil';
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // URL to redirect to after sign in process fails
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
