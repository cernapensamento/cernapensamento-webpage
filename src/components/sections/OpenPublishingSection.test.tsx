import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import OpenPublishingSection from './OpenPublishingSection';
import { getDictionaryClient } from '@/dictionaries/client';

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

describe('OpenPublishingSection', () => {
  beforeEach(() => {
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

  it.each(['gl', 'es'] as const)(
    'renders the 3-step Guest Author publishing flow, quota note, and localized links for %s without event mentions',
    (lang) => {
      const dict = getDictionaryClient(lang);
      const { container } = render(
        <OpenPublishingSection lang={lang} dict={dict.openPublishing} />
      );

      expect(
        screen.getByRole('heading', { level: 2, name: dict.openPublishing.title })
      ).toBeInTheDocument();
      expect(screen.getByText(dict.openPublishing.badge)).toBeInTheDocument();
      expect(screen.getByText(dict.openPublishing.lead)).toBeInTheDocument();

      const stepsList = screen.getByRole('list');
      const stepItems = within(stepsList).getAllByRole('listitem');
      expect(stepItems).toHaveLength(3);

      for (const step of dict.openPublishing.steps) {
        expect(within(stepsList).getByText(step.num)).toBeInTheDocument();
        expect(
          within(stepsList).getByRole('heading', { level: 3, name: step.title })
        ).toBeInTheDocument();
        expect(within(stepsList).getByText(step.description)).toBeInTheDocument();
      }

      expect(screen.getByText(dict.openPublishing.quotaNote)).toBeInTheDocument();

      const primaryLink = screen.getByRole('link', {
        name: new RegExp(dict.openPublishing.primaryCta, 'i'),
      });
      expect(primaryLink).toHaveAttribute('href', `/${lang}/contacto`);

      const secondaryLink = screen.getByRole('link', {
        name: new RegExp(dict.openPublishing.secondaryCta, 'i'),
      });
      expect(secondaryLink).toHaveAttribute('href', `/${lang}/asociacion#coleccions`);

      // Must not mention events or link to /noticias
      expect(container.textContent).not.toMatch(/eventos/i);
      expect(container.querySelector(`a[href="/${lang}/noticias"]`)).toBeNull();
    }
  );

  it('renders custom 3rd-locale strings without hardcoded Galician or Spanish fallbacks', () => {
    const enDict = {
      badge: 'Open Publishing',
      title: 'An open tribune for rigorous writing',
      lead: 'Anyone may propose a text under Editorial Board criteria.',
      stepsLabel: 'How to publish',
      steps: [
        { num: '01', tag: 'Proposal', title: 'Write to us', description: 'Send your draft.' },
        { num: '02', tag: 'Guest Author', title: 'Get Desk access', description: 'Edit freely.' },
        { num: '03', tag: 'Certification', title: 'Board review', description: 'Certified release.' },
      ],
      quotaLabel: 'Guest Author quota',
      quotaNote: 'Up to 2 publications per year and 4 in total.',
      primaryCta: 'Submit proposal',
      secondaryCta: 'Read publishing criteria',
    };

    render(<OpenPublishingSection lang="en" dict={enDict} />);

    expect(screen.getByRole('heading', { level: 2, name: enDict.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /submit proposal/i })).toHaveAttribute(
      'href',
      '/en/contacto'
    );
    expect(screen.getByRole('link', { name: /read publishing criteria/i })).toHaveAttribute(
      'href',
      '/en/asociacion#coleccions'
    );
  });
});
