import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EscritorioPublicationRow from './EscritorioPublicationRow';
import { getDictionaryClient } from '@/dictionaries/client';
import {
  PERMISSIONS,
  PUBLICATION_STATUSES,
  USER_ROLES,
  resolvePermissionsForRoles,
} from '@/lib/db/schema';
import type { PublicationDashboardItem } from '@/lib/db/types';

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

vi.mock('./PinArticleButton', () => ({
  default: () => <button type="button">Pin</button>,
}));

vi.mock('./DeleteArticleButton', () => ({
  default: () => <button type="button">Delete</button>,
}));

const basePub: PublicationDashboardItem = {
  id: 'pub-1',
  slug: 'mi-publicacion',
  title: { gl: 'Título en galego', es: 'Título en español' },
  subtitle: { gl: 'Subtítulo en galego', es: 'Subtítulo en español' },
  cover_image_url: null,
  type: 'essay',
  status: 'published',
  original_language: 'gl',
  is_pinned: false,
  created_at: '2026-04-01T10:00:00Z',
  updated_at: '2026-04-01T10:00:00Z',
  published_at: '2026-04-01T10:00:00Z',
  author_id: 'author-1',
  author: { id: 'author-1', full_name: 'Ana Silva' },
};

describe('EscritorioPublicationRow', () => {
  it('renders GL · ES badge for bilingual publications', () => {
    const dict = getDictionaryClient('gl');
    render(
      <EscritorioPublicationRow
        pub={basePub}
        lang="gl"
        dict={dict}
        forApproval={false}
        canReview={true}
      />
    );

    expect(screen.getByText('GL · ES')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Título en galego' })).toBeInTheDocument();
  });

  it('renders ES badge and resolves ES title via original_language for ES monolingual publication on /gl', () => {
    const dict = getDictionaryClient('gl');
    const monoEs: PublicationDashboardItem = {
      ...basePub,
      id: 'pub-es',
      original_language: 'es',
      title: { es: 'Ensayo solo en español' },
      subtitle: { es: 'Subtítulo en español' },
    };

    render(
      <EscritorioPublicationRow
        pub={monoEs}
        lang="gl"
        dict={dict}
        forApproval={false}
        canReview={true}
      />
    );

    expect(screen.getByText('ES')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ensayo solo en español' })).toBeInTheDocument();
    expect(screen.getByText('Subtítulo en español')).toBeInTheDocument();
  });

  it('renders GL badge for GL monolingual publication on /es', () => {
    const dict = getDictionaryClient('es');
    const monoGl: PublicationDashboardItem = {
      ...basePub,
      id: 'pub-gl',
      original_language: 'gl',
      title: { gl: 'Ensaio só en galego' },
      subtitle: null,
    };

    render(
      <EscritorioPublicationRow
        pub={monoGl}
        lang="es"
        dict={dict}
        forApproval={false}
        canReview={true}
      />
    );

    expect(screen.getByText('GL')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ensaio só en galego' })).toBeInTheDocument();
  });

  it('renders localized untitled draft fallback and language badge when a draft has no stored title', () => {
    const glDict = getDictionaryClient('gl');
    const esDict = getDictionaryClient('es');
    const untitledDraft: PublicationDashboardItem = {
      ...basePub,
      id: 'draft-empty',
      status: 'draft',
      original_language: 'es',
      title: {},
      subtitle: null,
    };

    const { rerender } = render(
      <EscritorioPublicationRow
        pub={untitledDraft}
        lang="gl"
        dict={glDict}
        forApproval={false}
        canReview={false}
      />
    );

    expect(screen.getByRole('heading', { name: 'Borrador sen título' })).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();

    rerender(
      <EscritorioPublicationRow
        pub={untitledDraft}
        lang="es"
        dict={esDict}
        forApproval={false}
        canReview={false}
      />
    );

    expect(screen.getByRole('heading', { name: 'Borrador sin título' })).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();
  });

  it.each([
    {
      label: 'reader',
      permissions: resolvePermissionsForRoles([USER_ROLES.READER]),
      expectPin: false,
      expectDelete: false,
    },
    {
      label: 'guest',
      permissions: resolvePermissionsForRoles([USER_ROLES.GUEST]),
      expectPin: false,
      expectDelete: false,
    },
    {
      label: 'member',
      permissions: resolvePermissionsForRoles([USER_ROLES.MEMBER]),
      expectPin: false,
      expectDelete: false,
    },
    {
      label: 'overlapping guest + member',
      permissions: resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]),
      expectPin: false,
      expectDelete: false,
    },
    {
      label: 'zero-role',
      permissions: [],
      expectPin: false,
      expectDelete: false,
    },
    {
      label: 'founder',
      permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER]),
      expectPin: true,
      expectDelete: true,
    },
    {
      label: 'admin',
      permissions: resolvePermissionsForRoles([USER_ROLES.ADMIN]),
      expectPin: true,
      expectDelete: true,
    },
    {
      label: 'overlapping founder + admin',
      permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]),
      expectPin: true,
      expectDelete: true,
    },
    {
      label: 'custom publications:pin only',
      permissions: [PERMISSIONS.PUBLICATIONS_PIN],
      expectPin: true,
      expectDelete: false,
    },
    {
      label: 'custom publications:delete_any only',
      permissions: [PERMISSIONS.PUBLICATIONS_DELETE_ANY],
      expectPin: false,
      expectDelete: true,
    },
    {
      label: 'custom publications:delete_own only on published',
      permissions: [PERMISSIONS.PUBLICATIONS_DELETE_OWN],
      expectPin: false,
      expectDelete: false,
    },
    {
      label: 'custom publications:review only',
      permissions: [PERMISSIONS.PUBLICATIONS_REVIEW],
      expectPin: false,
      expectDelete: false,
    },
  ])(
    'gates Pin and Delete on published article for $label',
    ({ permissions, expectPin, expectDelete }) => {
      const dict = getDictionaryClient('gl');
      render(
        <EscritorioPublicationRow
          pub={{ ...basePub, status: PUBLICATION_STATUSES.PUBLISHED }}
          lang="gl"
          dict={dict}
          forApproval={false}
          canReview={true}
          permissions={permissions}
        />
      );

      if (expectPin) {
        expect(screen.getByRole('button', { name: 'Pin' })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole('button', { name: 'Pin' })).not.toBeInTheDocument();
      }

      if (expectDelete) {
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
      }
    }
  );

  it.each([
    {
      label: 'reader',
      permissions: resolvePermissionsForRoles([USER_ROLES.READER]),
      expectDelete: false,
    },
    {
      label: 'zero-role',
      permissions: [],
      expectDelete: false,
    },
    {
      label: 'custom publications:pin only',
      permissions: [PERMISSIONS.PUBLICATIONS_PIN],
      expectDelete: false,
    },
    {
      label: 'custom publications:review only',
      permissions: [PERMISSIONS.PUBLICATIONS_REVIEW],
      expectDelete: false,
    },
    {
      label: 'guest',
      permissions: resolvePermissionsForRoles([USER_ROLES.GUEST]),
      expectDelete: true,
    },
    {
      label: 'member',
      permissions: resolvePermissionsForRoles([USER_ROLES.MEMBER]),
      expectDelete: true,
    },
    {
      label: 'overlapping guest + member',
      permissions: resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]),
      expectDelete: true,
    },
    {
      label: 'custom publications:delete_own only',
      permissions: [PERMISSIONS.PUBLICATIONS_DELETE_OWN],
      expectDelete: true,
    },
    {
      label: 'custom publications:delete_any only',
      permissions: [PERMISSIONS.PUBLICATIONS_DELETE_ANY],
      expectDelete: true,
    },
    {
      label: 'founder',
      permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER]),
      expectDelete: true,
    },
  ])('gates Delete (and hides Pin) on unpublished draft for $label', ({ permissions, expectDelete }) => {
    const dict = getDictionaryClient('gl');
    render(
      <EscritorioPublicationRow
        pub={{ ...basePub, status: PUBLICATION_STATUSES.DRAFT }}
        lang="gl"
        dict={dict}
        forApproval={false}
        canReview={true}
        permissions={permissions}
      />
    );

    expect(screen.queryByRole('button', { name: 'Pin' })).not.toBeInTheDocument();
    if (expectDelete) {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    } else {
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    }
  });

  it('hides Delete and Pin buttons in review queue (forApproval=true)', () => {
    const dict = getDictionaryClient('gl');
    render(
      <EscritorioPublicationRow
        pub={{ ...basePub, status: PUBLICATION_STATUSES.IN_REVIEW }}
        lang="gl"
        dict={dict}
        forApproval={true}
        permissions={resolvePermissionsForRoles([USER_ROLES.ADMIN])}
      />
    );

    expect(screen.queryByRole('button', { name: 'Pin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('falls back to legacy canReview behavior when permissions prop is omitted', () => {
    const dict = getDictionaryClient('gl');
    const { rerender } = render(
      <EscritorioPublicationRow
        pub={{ ...basePub, status: PUBLICATION_STATUSES.PUBLISHED }}
        lang="gl"
        dict={dict}
        forApproval={false}
        canReview={false}
      />
    );

    expect(screen.queryByRole('button', { name: 'Pin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

    rerender(
      <EscritorioPublicationRow
        pub={{ ...basePub, status: PUBLICATION_STATUSES.PUBLISHED }}
        lang="gl"
        dict={dict}
        forApproval={false}
        canReview={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Pin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
