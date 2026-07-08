'use client';

import { useState } from 'react';
import { subscribeEmail } from '@/utils/subscribe';

export default function FooterSubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      await subscribeEmail(email);
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <form className="flex w-full mt-2" onSubmit={handleSubscribe}>
      <input 
        className="bg-transparent border-b border-lines focus:border-gold focus:ring-0 px-0 py-2 w-full font-sans text-charcoal placeholder:text-charcoal/50 outline-none rounded-none" 
        placeholder="Correo electrónico" 
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button 
        className="text-xs font-semibold text-charcoal uppercase tracking-widest ml-4 hover:text-gold transition-colors duration-300 cursor-pointer disabled:opacity-50" 
        type="submit"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? '...' : status === 'success' ? '¡Listo!' : 'Enviar'}
      </button>
    </form>
  );
}
