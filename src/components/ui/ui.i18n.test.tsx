import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ThemeToggle from './ThemeToggle';
import SocialLinks from './SocialLinks';
import BackButton from './BackButton';
import { ThemeProvider } from '@/components/ThemeProvider';

let mockPathname = '/gl/articulos';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockPathname,
}));

describe('UI components i18n compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/gl/articulos';
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('ThemeToggle renders localized toggleTheme label after mount', async () => {
    mockPathname = '/es/articulos';
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Alternar tema' })).toBeInTheDocument();
    });
  });

  it('SocialLinks uses localized dictionary contactByEmail or injected contactLabel', () => {
    const { rerender } = render(<SocialLinks lang="gl" />);
    expect(screen.getByRole('link', { name: 'Contacto por Correo' })).toHaveAttribute(
      'href',
      'mailto:contacto@cernapensamento.org'
    );

    rerender(<SocialLinks lang="en" contactLabel="Contact by Email" />);
    expect(screen.getByRole('link', { name: 'Contact by Email' })).toBeInTheDocument();
  });

  it('BackButton hides on localized homepages and uses localized backToHome label on subpages', () => {
    mockPathname = '/gl';
    const { rerender, container } = render(<BackButton />);
    expect(container.firstChild).toBeNull();

    mockPathname = '/es/contacto';
    rerender(<BackButton />);
    const link = screen.getByRole('link', { name: 'Volver al inicio' });
    expect(link).toHaveAttribute('href', '/es');
  });
});
