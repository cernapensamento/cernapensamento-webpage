'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';
import { ToastContainer, ToastItem, ToastType } from './Toast';
import { ConfirmDialog, ConfirmDialogOptions } from './ConfirmDialog';
import { PromptDialog, PromptDialogOptions } from './PromptDialog';

export interface ToastOptions {
  title?: string;
  duration?: number;
}

export interface ToastApi {
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export interface FeedbackContextValue {
  toast: ToastApi;
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  prompt: (options: PromptDialogOptions) => Promise<string | null>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

/**
 * Provides shared toast notifications and promise-based confirmation/prompt dialogs.
 * Maintains one active confirmation and one active prompt; another request of the
 * same kind replaces the active dialog without settling its previous promise.
 */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmDialogOptions;
    resolve: (val: boolean) => void;
  } | null>(null);
  const [promptState, setPromptState] = useState<{
    options: PromptDialogOptions;
    resolve: (val: string | null) => void;
  } | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, options?: ToastOptions): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = {
      id,
      type,
      message,
      title: options?.title,
      duration: options?.duration,
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const toastApi: ToastApi = useMemo(() => ({
    success: (message, options) => addToast('success', message, options),
    error: (message, options) => addToast('error', message, options),
    warning: (message, options) => addToast('warning', message, options),
    info: (message, options) => addToast('info', message, options),
    dismiss: dismissToast,
    clear: () => setToasts([]),
  }), [addToast, dismissToast]);

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        options,
        resolve: (result: boolean) => {
          setConfirmState(null);
          resolve(result);
        },
      });
    });
  }, []);

  const prompt = useCallback((options: PromptDialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({
        options,
        resolve: (result: string | null) => {
          setPromptState(null);
          resolve(result);
        },
      });
    });
  }, []);

  const locale = useLocale();
  const dict = useMemo(() => getDictionaryClient(locale), [locale]);
  const feedbackDict = dict.feedback;

  const contextValue = useMemo<FeedbackContextValue>(() => ({
    toast: toastApi,
    confirm,
    prompt,
  }), [toastApi, confirm, prompt]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} dict={feedbackDict} />
      {confirmState && (
        <ConfirmDialog
          isOpen={true}
          options={confirmState.options}
          onConfirm={() => confirmState.resolve(true)}
          onCancel={() => confirmState.resolve(false)}
          dict={feedbackDict}
        />
      )}
      {promptState && (
        <PromptDialog
          isOpen={true}
          options={promptState.options}
          onConfirm={(val) => promptState.resolve(val)}
          onCancel={() => promptState.resolve(null)}
          dict={feedbackDict}
        />
      )}
    </FeedbackContext.Provider>
  );
}

/**
 * Returns the shared toast and dialog APIs.
 * @throws {Error} If called outside a FeedbackProvider.
 */
export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return ctx;
}

/**
 * Returns toast methods that create notifications and return dismissal IDs.
 * Durations are in milliseconds (default 4500); nonpositive values disable the timer.
 * @throws {Error} If called outside a FeedbackProvider.
 */
export function useToast(): ToastApi {
  const { toast } = useFeedback();
  return toast;
}

/**
 * Returns a dialog function resolving true on confirmation or false on cancellation.
 * @throws {Error} If called outside a FeedbackProvider.
 */
export function useConfirm(): (options: ConfirmDialogOptions) => Promise<boolean> {
  const { confirm } = useFeedback();
  return confirm;
}

/**
 * Returns a dialog function resolving the entered value after optional validation,
 * or null on cancellation. Input is returned without trimming.
 * @throws {Error} If called outside a FeedbackProvider.
 */
export function usePrompt(): (options: PromptDialogOptions) => Promise<string | null> {
  const { prompt } = useFeedback();
  return prompt;
}
