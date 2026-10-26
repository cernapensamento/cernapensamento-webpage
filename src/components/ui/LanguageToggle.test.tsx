import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageToggle from './LanguageToggle';

const mockPush = vi.fn();
let mockCurrentLocale = 'gl';
let mockPathname = '/gl/articulos';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => mockCurrentLocale,
}));

describe('LanguageToggle component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentLocale = 'gl';
    mockPathname = '/gl/articulos';
    // Clear cookies
    document.cookie = 'NEXT_LOCALE=; max-age=0; path=/';
  });

  it('renders current locale in uppercase with accessible label for next locale', () => {
    render(<LanguageToggle />);

    const button = screen.getByRole('button', { name: /cambiar a castellano/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('GL');
  });

  it('switches from gl to es on click, updates cookie and navigates', async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    const button = screen.getByRole('button', { name: /cambiar a castellano/i });
    await user.click(button);

    expect(document.cookie).toContain('NEXT_LOCALE=es');
    expect(mockPush).toHaveBeenCalledWith('/es/articulos');
  });

  it('renders ES button and targets Galego when current locale is es', async () => {
    mockCurrentLocale = 'es';
    mockPathname = '/es/contacto';

    const user = userEvent.setup();
    render(<LanguageToggle />);

    const button = screen.getByRole('button', { name: /cambiar a galego/i });
    expect(button).toHaveTextContent('ES');

    await user.click(button);
    expect(document.cookie).toContain('NEXT_LOCALE=gl');
    expect(mockPush).toHaveBeenCalledWith('/gl/contacto');
  });
});
