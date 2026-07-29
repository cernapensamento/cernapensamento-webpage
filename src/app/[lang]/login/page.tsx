'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { SITE_NAME } from '@/lib/constants';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const router = useRouter();
  const params = useParams();
  const lang = params.lang || 'es';
  const supabase = createClient();
  const dict = lang === 'es' ? esDict : glDict;
  const loginDict = dict.loginPage;

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'invalid_token') {
        setError(loginDict.invalidToken);
      } else if (params.get('error') === 'auth_failed') {
        setError(loginDict.googleAuthError);
      }
    }
  }, []);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : loginDict.googleAuthError);
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setShowResend(false);

    if (password.length < 6) {
      setError(loginDict.passError);
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
            router.push(`/${lang}/escritorio`);
          } else {
            router.push(`/${lang}/escritorio/perfil`);
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
            data: { nombre },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;
        setError(null);
        setSuccessMessage(loginDict.signupSuccess);
        setIsLogin(true);
      }
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : loginDict.genericAuthError;
      if (message.toLowerCase().includes('email not confirmed')) {
        message = loginDict.unconfirmedEmail;
        setShowResend(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (resendError) throw resendError;
      setSuccessMessage(loginDict.resendSuccess);
      setShowResend(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-parchment">
      <div className="w-full max-w-sm relative">
        
        <Link href={`/${lang}`} className="absolute -top-6 left-0 text-charcoal/40 hover:text-charcoal transition-colors font-serif text-4xl" aria-label={loginDict.backToHome}>
          ←
        </Link>

        <div className="text-center mb-12 flex flex-col items-center">
          <div className="relative mb-6">
            <Image 
              src="/images/logo/cernawhite.png" 
              alt="Cerna Pensamento" 
              width={400} 
              height={100} 
              className="h-16 md:h-20 w-auto object-contain block dark:hidden"
              priority
            />
            <Image 
              src="/images/logo/cernablack.png" 
              alt="Cerna Pensamento" 
              width={400} 
              height={100} 
              className="h-16 md:h-20 w-auto object-contain hidden dark:block"
              priority
            />
          </div>
          <p className="text-sm text-charcoal/60 uppercase tracking-widest font-semibold">
            {isLogin ? loginDict.loginTitle : loginDict.signupTitle}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-widest mb-2" htmlFor="nombre">
                {loginDict.fullName}
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface border border-lines text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/10 transition-all duration-200"
                placeholder={loginDict.namePlaceholder}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-widest mb-2" htmlFor="email">
              {loginDict.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface border border-lines text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/10 transition-all duration-200"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal/80 uppercase tracking-widest mb-2" htmlFor="password">
              {loginDict.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-surface border border-lines text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/10 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div role="alert" aria-live="polite" className="p-4 rounded border border-red-200 bg-red-50 flex flex-col gap-3 text-sm animate-in fade-in duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 shrink-0 text-lg" data-icon="error">error</span>
                <p className="text-red-800 font-sans mt-0.5">{error}</p>
              </div>
              {showResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="self-end text-xs font-semibold text-red-700 underline hover:text-red-900 disabled:opacity-50 cursor-pointer"
                >
                  {loginDict.resendBtn}
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div role="alert" aria-live="polite" className="p-4 rounded border border-green-200 bg-green-50 flex items-start gap-3 text-sm animate-in fade-in duration-300 shadow-sm">
              <span className="material-symbols-outlined text-green-500 shrink-0 text-lg" data-icon="check_circle">check_circle</span>
              <p className="text-green-800 font-sans mt-0.5">{successMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-charcoal text-parchment hover:bg-gold hover:text-parchment hover:border-gold transition-all duration-300 disabled:opacity-50 flex justify-center items-center font-semibold text-sm uppercase tracking-widest border border-charcoal cursor-pointer active:scale-99"
          >
            {loading ? (
              <span className="animate-pulse">{loginDict.processing}</span>
            ) : isLogin ? (
              loginDict.loginBtn
            ) : (
              loginDict.signupBtn
            )}
          </button>

          {isLogin && (
            <div className="text-center mt-4">
              <Link
                href={`/${lang}/recuperar-password`}
                className="text-xs text-charcoal/60 hover:text-charcoal transition-colors underline font-sans"
              >
                {loginDict.forgotPassword}
              </Link>
            </div>
          )}

          <div className="relative flex items-center justify-center mt-6 mb-6">
            <span className="absolute bg-parchment px-4 text-xs font-semibold uppercase tracking-widest text-charcoal/50">{loginDict.or}</span>
            <div className="w-full h-px bg-lines"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-4 px-6 bg-transparent text-charcoal hover:bg-charcoal/5 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-3 font-semibold text-sm uppercase tracking-widest border border-lines cursor-pointer active:scale-99"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {loginDict.continueWithGoogle}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setShowResend(false);
            }}
            className="text-xs text-gold hover:text-charcoal transition-colors uppercase tracking-widest font-semibold"
          >
            {isLogin
              ? loginDict.noAccount
              : loginDict.alreadyAccount}
          </button>
        </div>
      </div>
    </div>
  );
}
