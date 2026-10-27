'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface PromptDialogOptions {
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  inputLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  multiline?: boolean;
  validate?: (value: string) => string | null;
}

export interface PromptFeedbackDict {
  cancel?: string;
  accept?: string;
}

interface PromptDialogProps {
  isOpen: boolean;
  options: PromptDialogOptions;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  dict?: PromptFeedbackDict;
}

export function PromptDialog({
  isOpen,
  options,
  onConfirm,
  onCancel,
  dict,
}: PromptDialogProps) {
  const [value, setValue] = useState(options.defaultValue || '');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (options.validate) {
      const err = options.validate(value);
      if (err) {
        setError(err);
        return;
      }
    }
    onConfirm(value);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-dialog-title"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-surface p-6 sm:p-8 max-w-lg w-full border border-lines shadow-2xl animate-in zoom-in-95 duration-150">
        <h3
          id="prompt-dialog-title"
          className="font-serif text-2xl text-charcoal mb-2"
        >
          {options.title}
        </h3>
        {options.description && (
          <p className="font-sans text-xs text-charcoal/70 mb-5 leading-relaxed whitespace-pre-line">
            {options.description}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {options.inputLabel && (
            <label className="font-sans text-xs uppercase tracking-wider text-charcoal/60">
              {options.inputLabel}
            </label>
          )}

          {options.multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={4}
              placeholder={options.placeholder}
              className="w-full bg-parchment border border-lines p-3 text-sm font-sans text-charcoal focus:outline-none focus:border-gold resize-y transition-colors font-mono"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              placeholder={options.placeholder}
              className="w-full bg-parchment border border-lines px-3.5 py-2.5 text-sm font-sans text-charcoal focus:outline-none focus:border-gold transition-colors"
            />
          )}

          {error && (
            <p className="text-xs text-red-700 dark:text-red-400 font-sans mt-0.5">
              {error}
            </p>
          )}

          <div className="flex justify-end items-center gap-3 mt-4 pt-2 border-t border-lines/40">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 font-sans text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal hover:bg-lines/40 border border-lines transition-colors cursor-pointer"
            >
              {options.cancelLabel || dict?.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer"
            >
              {options.confirmLabel || dict?.accept}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
