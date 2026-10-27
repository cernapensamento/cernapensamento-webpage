'use client';

import React, { useEffect, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ToastFeedbackDict {
  close?: string;
  notificationsAria?: string;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  dict?: ToastFeedbackDict;
}

export function Toast({ toast, onDismiss, dict }: ToastProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef<number>(toast.duration ?? 4500);
  const startTimeRef = useRef<number>(0);

  const startTimer = () => {
    if (remainingTimeRef.current <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingTimeRef.current);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-gold';
      case 'error':
        return 'border-l-red-700 dark:border-l-red-500';
      case 'warning':
        return 'border-l-amber-600 dark:border-l-amber-500';
      case 'info':
      default:
        return 'border-l-charcoal/50 dark:border-l-charcoal/70';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <span className="material-symbols-outlined text-gold shrink-0 text-xl" aria-hidden="true">check_circle</span>;
      case 'error':
        return <span className="material-symbols-outlined text-red-700 dark:text-red-500 shrink-0 text-xl" aria-hidden="true">error</span>;
      case 'warning':
        return <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 shrink-0 text-xl" aria-hidden="true">warning</span>;
      case 'info':
      default:
        return <span className="material-symbols-outlined text-charcoal/60 dark:text-charcoal/80 shrink-0 text-xl" aria-hidden="true">info</span>;
    }
  };

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      className={`pointer-events-auto w-full max-w-sm bg-surface border border-lines border-l-4 ${getBorderColor()} shadow-2xl p-4 transition-all duration-300 flex items-start gap-3`}
    >
      <div className="pt-0.5">{getIcon()}</div>
      <div className="flex-grow min-w-0">
        {toast.title && (
          <h4 className="font-serif text-sm font-semibold text-charcoal leading-snug break-words">
            {toast.title}
          </h4>
        )}
        <p className="font-sans text-xs text-charcoal/80 leading-relaxed mt-0.5 break-words">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-charcoal/40 hover:text-charcoal transition-colors ml-auto shrink-0 p-1 cursor-pointer"
        aria-label={dict?.close}
      >
        <span className="material-symbols-outlined text-base leading-none">close</span>
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
  dict,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  dict?: ToastFeedbackDict;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label={dict?.notificationsAria}
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} dict={dict} />
      ))}
    </div>
  );
}
