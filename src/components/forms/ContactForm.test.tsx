import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';
import glDict from '@/dictionaries/gl.json';

describe('ContactForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders all required form fields and labels', () => {
    render(<ContactForm dict={glDict.contactForm} lang="gl" />);

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/asunto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mensaxe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/declaro que o contido é orixinal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar mensaxe/i })).toBeInTheDocument();
  });

  it('displays client-side validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<ContactForm dict={glDict.contactForm} lang="gl" />);

    const submitBtn = screen.getByRole('button', { name: /enviar mensaxe/i });
    await user.click(submitBtn);

    expect(screen.getByText('O nome é obrigatorio')).toBeInTheDocument();
    expect(screen.getByText('O correo é obrigatorio')).toBeInTheDocument();
    expect(screen.getByText('Selecciona un asunto')).toBeInTheDocument();
    expect(screen.getByText('A mensaxe é obrigatoria')).toBeInTheDocument();
    expect(screen.getByText('Debes aceptar as condicións')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('validates email format before sending', async () => {
    const user = userEvent.setup();
    render(<ContactForm dict={glDict.contactForm} lang="gl" />);

    await user.type(screen.getByLabelText(/nome completo/i), 'Rosalía');
    await user.type(screen.getByLabelText(/^email/i), 'invalid-email');
    await user.selectOptions(screen.getByLabelText(/asunto/i), 'Envío de Artigo');
    await user.type(screen.getByLabelText(/mensaxe/i), 'Texto de proba');
    await user.click(screen.getByLabelText(/declaro que o contido é orixinal/i));

    await user.click(screen.getByRole('button', { name: /enviar mensaxe/i }));

    expect(screen.getByText('O formato do correo electrónico non é válido')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('includes selected PDF file in submitted FormData and shows success screen', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, id: 'test_123' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ContactForm dict={glDict.contactForm} lang="gl" />);

    await user.type(screen.getByLabelText(/nome completo/i), 'Rosalía de Castro');
    await user.type(screen.getByLabelText(/^email/i), 'rosalia@cerna.gal');
    await user.selectOptions(screen.getByLabelText(/asunto/i), 'Envío de Artigo');
    await user.type(screen.getByLabelText(/mensaxe/i), 'Proposta de ensaio');
    await user.click(screen.getByLabelText(/declaro que o contido é orixinal/i));

    // Create a mock PDF file
    const pdfFile = new File(['%PDF-1.4 mock content'], 'ensaio.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    await user.upload(fileInput, pdfFile);

    // Verify file preview appears and unmounts the upload box
    expect(screen.getByText('ensaio.pdf')).toBeInTheDocument();

    // Submit form
    await user.click(screen.getByRole('button', { name: /enviar mensaxe/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
        method: 'POST',
      }));
    });

    const formDataSent: FormData = mockFetch.mock.calls[0][1].body;
    expect(formDataSent.get('fullName')).toBe('Rosalía de Castro');
    expect(formDataSent.get('email')).toBe('rosalia@cerna.gal');
    expect(formDataSent.get('subject')).toBe('Envío de Artigo');
    expect(formDataSent.get('message')).toBe('Proposta de ensaio');

    // CRITICAL: verify that the selected file is properly present in FormData
    const sentFile = formDataSent.get('file') as File;
    expect(sentFile).not.toBeNull();
    expect(sentFile.name).toBe('ensaio.pdf');

    // Verify success UI
    expect(await screen.findByText('Mensaxe enviada con éxito.')).toBeInTheDocument();
  });

  it('displays localized error alert when API returns send_failed', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'send_failed' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ContactForm dict={glDict.contactForm} lang="gl" />);

    await user.type(screen.getByLabelText(/nome completo/i), 'Rosalía');
    await user.type(screen.getByLabelText(/^email/i), 'rosalia@cerna.gal');
    await user.selectOptions(screen.getByLabelText(/asunto/i), 'Pregunta');
    await user.type(screen.getByLabelText(/mensaxe/i), 'Texto');
    await user.click(screen.getByLabelText(/declaro que o contido é orixinal/i));

    await user.click(screen.getByRole('button', { name: /enviar mensaxe/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Non foi posible entregar a túa mensaxe polo momento. Por favor, téntao de novo máis tarde.'
    );
  });
});
