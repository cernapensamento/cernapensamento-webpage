import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PinnedArticlesPanel from './PinnedArticlesPanel';
import ColumnistsSection from './ColumnistsSection';
import ContactSection from './ContactSection';
import FAQSection from './FAQSection';
import ArticlesMosaicSection from './ArticlesMosaicSection';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Section components modular i18n compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('PinnedArticlesPanel resolves localized fields and dictionary strings for a 3rd locale', () => {
    const enDict = {
      documentTypes: { essay: 'Essay' },
      mosaic: { pinnedTitle: 'Pinned Readings' },
      articles: { unknownAuthor: 'Unknown Author', featuredCoverAlt: 'Pinned cover' },
    };

    const pinned = [
      {
        id: 'pin-1',
        slug: 'pinned-essay',
        type: 'essay',
        title: { gl: 'Ensaio fixado', es: 'Ensayo fijado', en: 'Pinned Essay' },
        subtitle: { gl: 'Sub GL', es: 'Sub ES', en: 'Pinned Subtitle EN' },
        author: null,
      },
    ];

    render(<PinnedArticlesPanel articulos={pinned} lang="en" dict={enDict} />);

    expect(screen.getByRole('heading', { name: 'Pinned Readings' })).toBeInTheDocument();
    expect(screen.getByText('Essay')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pinned Essay' })).toBeInTheDocument();
    expect(screen.getByText('Pinned Subtitle EN')).toBeInTheDocument();
    expect(screen.getByText('Unknown Author')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/en/articulo/pinned-essay');
  });

  it('ColumnistsSection uses localized portrait, email, and instagram labels from dict', () => {
    const enColumnistsDict = {
      columnists: {
        tag: 'Our Team',
        title: 'Columnists of',
        publishedArticles: 'Published articles',
        emailLabel: 'Email',
        instagramLabel: 'Instagram',
        portraitOf: 'Portrait of',
        sendEmailTo: 'Send email to',
        instagramProfileOf: 'Instagram profile of',
        viewAllAuthors: 'View all authors',
      },
      authors: {
        'diego-araujo': 'Bio in English',
      },
    };

    render(<ColumnistsSection lang="en" dict={enColumnistsDict} />);

    expect(screen.getByText('Our Team')).toBeInTheDocument();
    expect(screen.getByAltText('Portrait of Diego Araújo')).toBeInTheDocument();
    expect(screen.getByLabelText('Send email to Diego Araújo')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram profile of Diego Araújo')).toBeInTheDocument();
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /view all authors/i })).toHaveAttribute('href', '/en/autores');
  });

  it('ColumnistsSection renders DB founder columnists with curated metadata while omitting non-founders', () => {
    const enColumnistsDict = {
      columnists: {
        tag: 'Our Team',
        title: 'Columnists of',
        publishedArticles: 'Published articles',
        emailLabel: 'Email',
        instagramLabel: 'Instagram',
        portraitOf: 'Portrait of',
        sendEmailTo: 'Send email to',
        instagramProfileOf: 'Instagram profile of',
        viewAllAuthors: 'View all authors',
      },
      authors: {
        'diego-araujo': 'Curated Diego Bio',
      },
    };

    render(
      <ColumnistsSection
        lang="en"
        dict={enColumnistsDict}
        columnists={[
          {
            id: 'f-1',
            full_name: 'Diego Araújo',
            slug: 'diego-araujo',
            bio: null,
            avatar_url: null,
            roles: ['founder'],
          },
          {
            id: 'f-2',
            full_name: 'Nova Fundadora',
            slug: 'nova-fundadora',
            bio: { en: 'New founder bio', gl: 'Bio nova' },
            avatar_url: 'https://example.com/nova.webp',
            roles: ['founder'],
          },
          {
            id: 'a-1',
            full_name: 'Admin Only',
            slug: 'admin-only',
            bio: null,
            avatar_url: null,
            roles: ['admin'],
          },
          {
            id: 'm-1',
            full_name: 'Member Only',
            slug: 'member-only',
            bio: null,
            avatar_url: null,
            roles: ['member'],
          },
        ]}
      />
    );

    const diegoPortrait = screen.getByAltText('Portrait of Diego Araújo');
    expect(diegoPortrait).toHaveAttribute('src', '/images/columnistas/diego.webp');
    expect(screen.getByLabelText('Send email to Diego Araújo')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram profile of Diego Araújo')).toBeInTheDocument();

    const novaPortrait = screen.getByAltText('Portrait of Nova Fundadora');
    expect(novaPortrait).toHaveAttribute('src', 'https://example.com/nova.webp');
    expect(screen.getByText('New founder bio')).toBeInTheDocument();
    expect(screen.queryByLabelText('Send email to Nova Fundadora')).not.toBeInTheDocument();

    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
    expect(screen.queryByText('Member Only')).not.toBeInTheDocument();
    expect(screen.queryByText('Héctor González')).not.toBeInTheDocument();
  });

  it('ContactSection avoids hardcoded Galician fallbacks when given a partial 3rd-locale dict', () => {
    const enContactDict = {
      tag: 'Contact & Collaboration',
      title: 'Let us talk about ideas',
      description: 'Send us your drafts.',
      button: 'SUBMIT PROPOSAL',
      editorialChannel: 'Editorial Desk',
      proposalsTitle: 'Essays and Articles',
      proposalsDesc: 'Evaluated by the board.',
      directChannel: 'Direct Channel',
      directTitle: 'General Inquiries',
      directDesc: 'Write to us directly.',
      email: 'contact@example.org',
    };

    render(<ContactSection lang="en" dict={enContactDict} />);

    expect(screen.getByRole('region', { name: 'Contact & Collaboration' })).toBeInTheDocument();
    expect(screen.getByText('Editorial Desk')).toBeInTheDocument();
    expect(screen.getByText('Essays and Articles')).toBeInTheDocument();
    expect(screen.getByText('Direct Channel')).toBeInTheDocument();
    expect(screen.getByText('General Inquiries')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /submit proposal/i })).toHaveAttribute('href', '/en/contacto');
  });

  it('FAQSection renders localized items and contactUs without hardcoded strings', () => {
    const enFaqDict = {
      tag: 'FAQ',
      title: 'Frequently Asked Questions',
      description: 'Answers about Cerna.',
      items: [{ question: 'What is Cerna?', answer: 'An independent cultural journal.' }],
      moreQuestions: 'Still have questions?',
      contactUs: 'Write to our team',
      statutesLink: 'Association Statutes →',
    };

    render(<FAQSection lang="en" dict={enFaqDict} />);

    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Write to our team' })).toHaveAttribute('href', '/en/contacto');
    expect(screen.getByRole('link', { name: 'Association Statutes →' })).toHaveAttribute(
      'href',
      '/en/asociacion/estatutos'
    );
  });

  it('ArticlesMosaicSection falls back cleanly to dictionary client when dict is omitted', () => {
    render(<ArticlesMosaicSection articulos={[]} lang="es" />);

    expect(screen.getByText('No hay publicaciones disponibles en este momento.')).toBeInTheDocument();
  });
});
