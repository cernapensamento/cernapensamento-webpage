'use client';

import React, { useEffect, useRef } from 'react';

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

export interface ConfirmFeedbackDict {
  confirm?: string;
  cancel?: string;
  delete?: string;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  options: ConfirmDialogOptions;
  onConfirm: () => void;
  onCancel: () => void;
  dict?: ConfirmFeedbackDict;
}

export function ConfirmDialog({
  isOpen,
  options,
  onConfirm,
  onCancel,
  dict,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Auto-focus the safest button: cancel if danger, confirm otherwise
    const timer = setTimeout(() => {
      if (options.variant === 'danger') {
        cancelBtnRef.current?.focus();
      } else {
        confirmBtnRef.current?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, options.variant, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-surface p-6 sm:p-8 max-w-md w-full border border-lines shadow-2xl animate-in zoom-in-95 duration-150">
        <h3
          id="confirm-dialog-title"
          className="font-serif text-2xl text-charcoal mb-3"
        >
          {options.title}
        </h3>
        <p
          id="confirm-dialog-desc"
          className="font-sans text-sm text-charcoal/70 mb-8 leading-relaxed whitespace-pre-line"
        >
          {options.description}
        </p>
        <div className="flex justify-end items-center gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="px-6 py-2 font-sans text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal hover:bg-lines/40 border border-lines transition-colors cursor-pointer"
          >
            {options.cancelLabel || dict?.cancel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`px-6 py-2 font-sans text-xs uppercase tracking-widest text-parchment transition-colors cursor-pointer ${
              options.variant === 'danger'
                ? 'bg-red-800 hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-800'
                : 'bg-charcoal hover:bg-gold'
            }`}
          >
            {options.confirmLabel || (options.variant === 'danger' ? dict?.delete : dict?.confirm)}
          </button>
        </div>
      </div>
    </div>
  );
}
