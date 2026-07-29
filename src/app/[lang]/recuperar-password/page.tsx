'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const params = useParams();
  const lang = (params.lang as string) || 'es';
  const supabase = createClient();
  
  const dict = lang === 'es' ? esDict : glDict;
  const loginDict = dict.loginPage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/${lang}/actualizar-password`,
      });
      
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : loginDict.genericAuthError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-parchment">
      <div className="w-full max-w-sm relative">
        <Link href={`/${lang}/login`} className="absolute -top-6 left-0 text-charcoal/40 hover:text-charcoal transition-colors font-serif text-4xl" aria-label={loginDict.backToHome}>
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
            {loginDict.recoverTitle}
          </p>
        </div>

        {success ? (
          <div role="alert" aria-live="polite" className="p-4 rounded border border-green-200 bg-green-50 flex items-start gap-3 text-sm animate-in fade-in duration-300 shadow-sm text-center">
            <p className="text-green-800 font-sans mt-0.5">{loginDict.recoverSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-charcoal/80 text-center mb-4">
              {loginDict.recoverSubtitle}
            </p>
            
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

            {error && (
              <div role="alert" aria-live="polite" className="p-4 rounded border border-red-200 bg-red-50 flex flex-col gap-3 text-sm animate-in fade-in duration-300 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-500 shrink-0 text-lg" data-icon="error">error</span>
                  <p className="text-red-800 font-sans mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-charcoal text-parchment hover:bg-gold hover:text-parchment hover:border-gold transition-all duration-300 disabled:opacity-50 flex justify-center items-center font-semibold text-sm uppercase tracking-widest border border-charcoal cursor-pointer active:scale-99"
            >
              {loading ? (
                <span className="animate-pulse">{loginDict.processing}</span>
              ) : (
                loginDict.sendLink
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
