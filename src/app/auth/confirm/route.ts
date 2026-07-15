import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/escritorio/perfil'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // Redirigir al usuario a la página deseada después de confirmar
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Si hay error (token expirado o inválido), redirigir al login con parámetro de error
  return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
}
