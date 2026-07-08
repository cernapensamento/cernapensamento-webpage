'use client';

import { useState } from 'react';
import { subscribeEmail } from '@/utils/subscribe';

export default function SubscribeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await subscribeEmail(email);
      
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setEmail('');
      }, 3000);
    } catch (error) {
      console.error(error);
      alert('Error al suscribirse. Por favor, intente de nuevo.');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="font-sans text-xs font-semibold text-parchment bg-charcoal px-4 py-2 hover:bg-gold hover:text-parchment transition-all duration-300 uppercase tracking-wider cursor-pointer border border-charcoal/10 dark:border-white/10 shadow-xs active:scale-95"
      >
        Suscribirse
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[100] px-4">
          <div className="bg-parchment border border-lines p-8 max-w-md w-full relative shadow-2xl animate-in fade-in duration-300">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-charcoal/60 hover:text-charcoal text-xl"
            >
              &times;
            </button>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="text-center">
                  <span className="text-4xl text-gold font-serif">§</span>
                  <h3 className="font-serif text-2xl text-charcoal mt-2 mb-1">Únete a la Disertación</h3>
                  <p className="text-charcoal/70 font-sans text-sm">
                    Recibe semanalmente los mejores análisis, ensayos y crítica cultural de El Dialecto directamente en tu bandeja.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest font-semibold text-charcoal">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@dominio.com"
                    className="w-full bg-surface border border-lines px-4 py-3 text-sm text-charcoal focus:outline-hidden focus:border-gold transition-colors font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-charcoal hover:bg-gold text-parchment hover:text-parchment text-xs font-semibold uppercase tracking-widest py-3 transition-colors duration-300 cursor-pointer"
                >
                  Confirmar Suscripción
                </button>
              </form>
            ) : (
              <div className="text-center py-8 flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                <span className="text-5xl text-gold font-serif">✓</span>
                <h3 className="font-serif text-2xl text-charcoal">Registro Exitoso</h3>
                <p className="text-charcoal/70 font-sans text-sm leading-relaxed px-4">
                  Se ha registrado <span className="font-semibold">{email}</span>. Bienvenido a nuestra comunidad de lectores y autores.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
