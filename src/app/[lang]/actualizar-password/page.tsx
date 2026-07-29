'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

export default function ActualizarPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || 'es';
  const supabase = createClient();
  
  const dict = lang === 'es' ? esDict : glDict;
  const loginDict = dict.loginPage;

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
      } else {
        setSessionChecked(true);
      }
    };
    checkSession();
  }, [supabase, router, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError(loginDict.passError);
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      alert(loginDict.updateSuccess);
      router.push(`/${lang}/escritorio`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : loginDict.genericAuthError);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-parchment">
      <div className="w-full max-w-sm relative">
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
            {loginDict.updateTitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-charcoal/80 text-center mb-4">
            {loginDict.updateSubtitle}
          </p>
          
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
              loginDict.updateBtn
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
