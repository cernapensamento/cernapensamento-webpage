'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient, type Dictionary } from '@/dictionaries/client';

const MIN_PASSWORD_LENGTH = 6;

type StatusMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

interface PasswordFormProps {
  dict?: Partial<Dictionary['dashboard']>;
  lang?: string;
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message: string }).message.trim().length > 0
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

export default function PasswordForm({ dict: propDict, lang: propLang }: PasswordFormProps = {}) {
  const detectedLang = useLocale();
  const activeLang = propLang || detectedLang;
  const fallbackDashboard = getDictionaryClient(activeLang).dashboard;
  const dashboardDict = {
    ...fallbackDashboard,
    ...propDict,
    passwordForm: {
      ...fallbackDashboard.passwordForm,
      ...propDict?.passwordForm,
    },
  };
  const pf = dashboardDict.passwordForm;

  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);
  const supabase = createClient();

  const handleClose = () => {
    setIsOpen(false);
    setStatusMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (password !== confirmPassword) {
      setStatusMessage({ type: 'error', text: pf.mismatch });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatusMessage({ type: 'error', text: pf.tooShort });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setStatusMessage({ type: 'success', text: pf.success });
      setPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const msg = resolveErrorMessage(error, dashboardDict.unknownError);
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-parchment transition-colors font-semibold text-xs uppercase tracking-widest cursor-pointer"
      >
        {pf.button}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm">
          <div className="bg-parchment p-8 w-full max-w-md relative border border-lines shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-charcoal/40 hover:text-charcoal transition-colors material-symbols-outlined cursor-pointer"
              aria-label={pf.close}
            >
              close
            </button>

            <h3 className="font-serif text-2xl text-charcoal mb-6 pr-6">{pf.modalTitle}</h3>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label
                  htmlFor="new_password"
                  className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1"
                >
                  {pf.newPassword}
                </label>
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
                <label
                  htmlFor="confirm_password"
                  className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1"
                >
                  {pf.confirmPassword}
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
                />
              </div>

              {statusMessage && (
                <div
                  role={statusMessage.type === 'error' ? 'alert' : 'status'}
                  className={`p-4 text-sm border ${
                    statusMessage.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-green-200 bg-green-50 text-green-800'
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-charcoal text-parchment hover:bg-gold transition-colors font-semibold text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer"
              >
                {loading ? pf.updating : pf.save}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
