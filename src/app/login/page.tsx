'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { SITE_NAME } from '@/lib/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user) {
          const { data: profile } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', data.user.id)
            .single();
            
          const rol = profile?.rol;
          if (rol === 'escritor' || rol === 'admin') {
            router.push('/escritorio');
          } else {
            router.push('/escritorio/perfil');
          }
          router.refresh();
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nombre }
          }
        });
        if (error) throw error;
        setError(null);
        setSuccessMessage('Registro exitoso. Inicia sesión para continuar.');
        setIsLogin(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error durante la autenticación.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-parchment">
      <div className="w-full max-w-sm">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal text-charcoal tracking-tight mb-2">
            {SITE_NAME}
          </h1>
          <p className="text-sm text-charcoal/60 uppercase tracking-widest font-semibold">
            {isLogin ? 'Acceso de Autor' : 'Registro de Autor'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-8">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-widest mb-2" htmlFor="nombre">
                Nombre completo
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-widest mb-2" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-widest mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div role="alert" aria-live="polite" className="p-4 border border-red-900/20 bg-red-50/50 flex items-start gap-3 text-sm animate-in fade-in duration-300">
              <span className="material-symbols-outlined text-red-800 shrink-0 text-lg" data-icon="error">error</span>
              <p className="text-red-900 font-sans mt-0.5">{error}</p>
            </div>
          )}

          {successMessage && (
            <div role="alert" aria-live="polite" className="p-4 border border-green-900/20 bg-green-50/50 flex items-start gap-3 text-sm animate-in fade-in duration-300">
              <span className="material-symbols-outlined text-green-800 shrink-0 text-lg" data-icon="check_circle">check_circle</span>
              <p className="text-green-900 font-sans mt-0.5">{successMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-charcoal text-parchment hover:bg-gold hover:text-parchment hover:border-gold transition-all duration-300 disabled:opacity-50 flex justify-center items-center font-semibold text-sm uppercase tracking-widest border border-charcoal cursor-pointer active:scale-99"
          >
            {loading ? (
              <span className="animate-pulse">Procesando...</span>
            ) : isLogin ? (
              'Ingresar'
            ) : (
              'Registrarse'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-gold hover:text-charcoal transition-colors uppercase tracking-widest font-semibold"
          >
            {isLogin
              ? '¿No tienes cuenta? Solicita acceso'
              : '¿Ya eres autor? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
