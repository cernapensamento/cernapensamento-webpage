import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicNavBar from './PublicNavBar';
import SideMenu from './SideMenu';
import SiteFooter from './SiteFooter';
import { ThemeProvider } from '@/components/ThemeProvider';

let mockPathname = '/gl/articulos';
let mockHeaderLocale: string | null = 'gl';
let mockAuthState: {
  user: { email?: string; user_metadata?: Record<string, unknown> } | null;
  profile: { full_name?: string | null; avatar_url?: string | null; role?: string | null } | null;
  loading: boolean;
} = {
  user: null,
  profile: null,
  loading: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockPathname,
}));

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => (name === 'x-locale' ? mockHeaderLocale : null),
  }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/actions/auth', () => ({
  handleSignOut: vi.fn(),
}));

describe('Layout components i18n and columnist canonicalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/gl/articulos';
    mockHeaderLocale = 'gl';
    mockAuthState = {
      user: null,
      profile: null,
      loading: false,
    };

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

  it('PublicNavBar renders canonical COLUMNISTS (Denís Fernández) with founderBios and localized nav labels', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <PublicNavBar />
      </ThemeProvider>
    );

    const autoresToggle = screen.getByRole('button', { name: 'Autores' });
    await user.hover(autoresToggle);

    expect(screen.getByText('Denís Fernández')).toBeInTheDocument();
    expect(screen.getByText('Análise institucional e cultural.')).toBeInTheDocument();
    expect(screen.getByText('Diego Araújo')).toBeInTheDocument();
    expect(screen.getByText('Economía, teoría do valor e filosofía política.')).toBeInTheDocument();
  });

  it('PublicNavBar uses localized userMenuAria, profileAvatarAlt, accountLabel, defaultUser, and resolveRoleLabel', async () => {
    const user = userEvent.setup();
    mockPathname = '/es/escritorio';
    mockAuthState = {
      user: { user_metadata: {} },
      profile: {
        full_name: null,
        avatar_url: 'https://example.com/avatar.webp',
        role: 'founder',
      },
      loading: false,
    };

    render(
      <ThemeProvider>
        <PublicNavBar />
      </ThemeProvider>
    );

    const userMenuBtn = screen.getByRole('button', { name: 'Menú de usuario' });
    expect(screen.getByAltText('Perfil')).toBeInTheDocument();

    await user.click(userMenuBtn);
    expect(screen.getByText('FUNDADOR')).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Tu Perfil/i })).toHaveAttribute('href', '/es/escritorio/perfil');

    // Open mobile drawer and verify accountLabel in Spanish
    const openMobileBtn = screen.getByRole('button', { name: 'Abrir menú' });
    await user.click(openMobileBtn);
    expect(screen.getByText('Tu Cuenta • Usuario')).toBeInTheDocument();
  });

  it('SideMenu uses canonical COLUMNISTS and localized contactByEmail SocialLinks label', async () => {
    mockPathname = '/es/contacto';
    const user = userEvent.setup();

    render(<SideMenu />);

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.getByText('Denís Fernández')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contacto por Correo' })).toHaveAttribute(
      'href',
      'mailto:contacto@cernapensamento.org'
    );
  });

  it('SiteFooter resolves locale from headers and falls back cleanly to i18n.defaultLocale', async () => {
    mockHeaderLocale = 'es';
    mockPathname = '/es/articulos';
    const esElement = await SiteFooter();
    const { unmount } = render(esElement);

    expect(screen.getByText('PUBLICACIONES')).toBeInTheDocument();
    expect(screen.getByText('Archivo General')).toBeInTheDocument();
    expect(screen.getByText('Privacidad')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contacto por Correo' })).toBeInTheDocument();
    unmount();

    mockHeaderLocale = 'unknown-locale';
    mockPathname = '/gl/articulos';
    const fallbackElement = await SiteFooter();
    render(fallbackElement);

    expect(screen.getByText('PUBLICACIÓNS')).toBeInTheDocument();
    expect(screen.getByText('Arquivo Xeral')).toBeInTheDocument();
    expect(screen.getByText('Privacidade')).toBeInTheDocument();
  });
});
