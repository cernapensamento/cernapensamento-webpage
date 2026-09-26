import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      if (next && next.startsWith('/') && !next.startsWith('//')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Check user profile for role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', user.id)
          .single()
        
        const rol = profile?.rol
        const redirectPath = (rol === 'escritor' || rol === 'admin') ? '/escritorio' : '/escritorio/perfil'
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }

      return NextResponse.redirect(`${origin}/escritorio/perfil`)
    }
  }

  // Si el usuario ya está autenticado (p. ej. inició sesión manualmente antes de abrir el correo),
  // enviarlo directamente a su escritorio en lugar de un error
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return NextResponse.redirect(`${origin}/escritorio/perfil`)
  }

  // Redirigir a login con parámetro de error en lugar de la ruta inexistente /auth/auth-error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

