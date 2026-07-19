'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function PasswordForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const handleClose = () => {
    setIsOpen(false);
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setMessage('Contraseña actualizada con éxito.');
      setPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      setMessage(`Error al actualizar la contraseña: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-parchment transition-colors font-semibold text-xs uppercase tracking-widest"
      >
        Cambiar Contraseña
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm">
          <div className="bg-parchment p-8 w-full max-w-md relative border border-lines shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button type="button" 
              onClick={handleClose}
              className="absolute top-4 right-4 text-charcoal/40 hover:text-charcoal transition-colors material-symbols-outlined"
              aria-label="Cerrar"
            >
              close
            </button>
            
            <h3 className="font-serif text-2xl text-charcoal mb-6 pr-6">Actualizar Contraseña</h3>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label htmlFor="new_password" className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Nueva Contraseña</label>
                <input
                  id="new_password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
                />
              </div>
              <div>
                <label htmlFor="confirm_password" className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">Confirmar Nueva Contraseña</label>
                <input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
                />
              </div>

              {message && (
                <div className={`p-4 text-sm ${message.includes('Error') || message.includes('no coinciden') || message.includes('caracteres') ? 'border border-red-200 bg-red-50 text-red-800' : 'border border-green-200 bg-green-50 text-green-800'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-charcoal text-parchment hover:bg-gold transition-colors font-semibold text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
