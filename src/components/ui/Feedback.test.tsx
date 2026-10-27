import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FeedbackProvider,
  useToast,
  useConfirm,
  usePrompt,
} from './FeedbackProvider';

let mockPathname = '/gl/articulos';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

function TestFeedbackConsumer({
  onConfirmResult,
  onPromptResult,
}: {
  onConfirmResult?: (val: boolean) => void;
  onPromptResult?: (val: string | null) => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const prompt = usePrompt();

  return (
    <div>
      <button
        onClick={() => toast.success('Artigo gardado correctamente', { title: 'Éxito' })}
      >
        Trigger Success Toast
      </button>
      <button
        onClick={() => toast.error('Non tes permisos', { title: 'Erro' })}
      >
        Trigger Error Toast
      </button>
      <button
        onClick={async () => {
          const res = await confirm({
            title: '¿Eliminar artigo?',
            description: 'Esta acción non se pode desfacer.',
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            variant: 'danger',
          });
          onConfirmResult?.(res);
        }}
      >
        Trigger Confirm
      </button>
      <button
        onClick={async () => {
          const res = await prompt({
            title: 'Inserir vídeo',
            description: 'Introduce o URL:',
            placeholder: 'https://...',
            defaultValue: 'https://youtube.com/watch?v=123',
            confirmLabel: 'Inserir',
            cancelLabel: 'Cancelar',
          });
          onPromptResult?.(res);
        }}
      >
        Trigger Prompt
      </button>
      <button
        onClick={async () => {
          const res = await confirm({
            title: 'Confirmación estándar',
            description: 'Descrición de proba',
          });
          onConfirmResult?.(res);
        }}
      >
        Trigger Default Confirm
      </button>
      <button
        onClick={async () => {
          const res = await prompt({
            title: 'Prompt estándar',
          });
          onPromptResult?.(res);
        }}
      >
        Trigger Default Prompt
      </button>
    </div>
  );
}

describe('Editorial Feedback System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Toast Notifications', () => {
    it('renders a success toast with title and message', async () => {
      const user = userEvent.setup();
      render(
        <FeedbackProvider>
          <TestFeedbackConsumer />
        </FeedbackProvider>
      );

      await user.click(screen.getByText('Trigger Success Toast'));

      expect(screen.getByText('Éxito')).toBeInTheDocument();
      expect(screen.getByText('Artigo gardado correctamente')).toBeInTheDocument();
      const toastEl = screen.getByRole('status');
      expect(toastEl).toBeInTheDocument();
    });

    it('renders an error toast with role="alert"', async () => {
      const user = userEvent.setup();
      render(
        <FeedbackProvider>
          <TestFeedbackConsumer />
        </FeedbackProvider>
      );

      await user.click(screen.getByText('Trigger Error Toast'));

      expect(screen.getByText('Erro')).toBeInTheDocument();
      expect(screen.getByText('Non tes permisos')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('dismisses toast when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FeedbackProvider>
          <TestFeedbackConsumer />
        </FeedbackProvider>
      );

      await user.click(screen.getByText('Trigger Success Toast'));
      expect(screen.getByText('Artigo gardado correctamente')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /pechar/i });
      await user.click(closeBtn);

      expect(screen.queryByText('Artigo gardado correctamente')).not.toBeInTheDocument();
    });
  });

  describe('Confirm Dialog', () => {
    it('opens dialog, renders title/desc and resolves true on confirm', async () => {
      const user = userEvent.setup();
      const onConfirmResult = vi.fn();

      render(
        <FeedbackProvider>
          <TestFeedbackConsumer onConfirmResult={onConfirmResult} />
        </FeedbackProvider>
      );

      await user.click(screen.getByText('Trigger Confirm'));

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('¿Eliminar artigo?')).toBeInTheDocument();
      expect(screen.getByText('Esta acción non se pode desfacer.')).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: 'Eliminar' });
      await user.click(confirmBtn);

      expect(onConfirmResult).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('resolves false on cancel button click', async () => {
      const user = userEvent.setup();
      const onConfirmResult = vi.fn();

      render(
        <FeedbackProvider>
          <TestFeedbackConsumer onConfirmResult={onConfirmResult} />
        </FeedbackProvider>
      );

      await user.click(screen.getByText('Trigger Confirm'));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
      await user.click(cancelBtn);

      expect(onConfirmResult).toHaveBeenCalledWith(false);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('resolves false when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onConfirmResult = vi.fn();

      render(
        <FeedbackProvider>
          <TestFeedbackConsumer onConfirmResult={onConfirmResult} />
        </FeedbackProvider>
      );

      await user.click(screen.getByText('Trigger Confirm'));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(onConfirmResult).toHaveBeenCalledWith(false);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('Prompt Dialog', () => {
    it('opens prompt, shows default value, allows typing and resolves value on submit', async () => {
      const user = userEvent.setup();
      const onPromptResult = vi.fn();

      render(
        <FeedbackProvider>
          <TestFeedbackConsumer onPromptResult={onPromptResult} />
        </FeedbackProvider>
      );

      await user.click(screen.getByText('Trigger Prompt'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Inserir vídeo')).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('https://youtube.com/watch?v=123');

      await user.clear(input);
      await user.type(input, 'https://youtube.com/watch?v=456');

      const submitBtn = screen.getByRole('button', { name: 'Inserir' });
      await user.click(submitBtn);

      expect(onPromptResult).toHaveBeenCalledWith('https://youtube.com/watch?v=456');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('resolves null on cancel', async () => {
      const user = userEvent.setup();
      const onPromptResult = vi.fn();

      render(
        <FeedbackProvider>
          <TestFeedbackConsumer onPromptResult={onPromptResult} />
        </FeedbackProvider>
      );

      await user.click(screen.getByText('Trigger Prompt'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
      await user.click(cancelBtn);

      expect(onPromptResult).toHaveBeenCalledWith(null);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('resolves null on Escape key', async () => {
      const user = userEvent.setup();
      const onPromptResult = vi.fn();

      render(
        <FeedbackProvider>
          <TestFeedbackConsumer onPromptResult={onPromptResult} />
        </FeedbackProvider>
      );

      await user.click(screen.getByText('Trigger Prompt'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(onPromptResult).toHaveBeenCalledWith(null);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Dictionary and i18n Integration', () => {
    it('uses Galician dictionary defaults when locale is gl', async () => {
      mockPathname = '/gl/articulos';
      const user = userEvent.setup();

      render(
        <FeedbackProvider>
          <TestFeedbackConsumer />
        </FeedbackProvider>
      );

      // Verify Toast close label
      await user.click(screen.getByText('Trigger Success Toast'));
      expect(screen.getByRole('button', { name: 'Pechar' })).toBeInTheDocument();

      // Verify Default Confirm labels
      await user.click(screen.getByText('Trigger Default Confirm'));
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      // Verify Default Prompt labels
      await user.click(screen.getByText('Trigger Default Prompt'));
      expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('uses Spanish dictionary defaults when locale is es', async () => {
      mockPathname = '/es/articulos';
      const user = userEvent.setup();

      render(
        <FeedbackProvider>
          <TestFeedbackConsumer />
        </FeedbackProvider>
      );

      // Verify Toast close label in Spanish ("Cerrar")
      await user.click(screen.getByText('Trigger Success Toast'));
      expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();

      // Verify Default Confirm labels in Spanish
      await user.click(screen.getByText('Trigger Default Confirm'));
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      // Verify Default Prompt labels in Spanish
      await user.click(screen.getByText('Trigger Default Prompt'));
      expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });
  });
});
