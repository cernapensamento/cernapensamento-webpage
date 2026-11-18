import React from 'react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import TagsSection from './TagsSection';
import { getDictionaryClient } from '@/dictionaries/client';
import { slugify } from '@/lib/utils/slug';
import type { TagItem } from '@/lib/db/types';

function makeTags(count: number): TagItem[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `tag-${idx + 1}`,
    slug: `tag-slug-${idx + 1}`,
    name: `Etiqueta ${idx + 1}`,
  }));
}

describe('TagsSection', () => {
  it('lets keyboard users toggle a persistent pause for all rows', async () => {
    const dict = getDictionaryClient('gl');
    const user = userEvent.setup();
    const { container } = render(<TagsSection lang="gl" dict={dict.tags} tags={makeTags(12)} />);
    const button = screen.getByRole('button', { name: dict.tags.pauseAnimation });
    const marquee = container.querySelector('.tags-marquee');

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(marquee).toHaveAttribute('data-paused', 'true');
    await user.tab();
    expect(button).not.toHaveFocus();
    expect(marquee).toHaveAttribute('data-paused', 'true');
    button.focus();
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(marquee).toHaveAttribute('data-paused', 'false');
  });

  it('renders all supplied tags as uppercase links without section numbers or descriptions', () => {
    const dict = getDictionaryClient('gl');
    const tags = makeTags(16);

    const { container } = render(
      <TagsSection lang="gl" dict={dict.tags} tags={tags} />
    );

    const desktopLayout = screen.getByTestId('tags-marquee-4-rows');
    const links = within(desktopLayout).getAllByRole('link');
    const hrefsByName = new Map<string, string[]>();

    for (const link of links) {
      expect(link.className).toContain('uppercase');
      const name = link.textContent?.trim() ?? '';
      const href = link.getAttribute('href') ?? '';
      hrefsByName.set(name, [...(hrefsByName.get(name) ?? []), href]);
    }

    for (const tag of tags) {
      const hrefs = hrefsByName.get(tag.name) ?? [];
      expect(hrefs.length).toBeGreaterThanOrEqual(1);
      for (const href of hrefs) {
        expect(href).toBe(`/gl/articulos?tema=${tag.slug}`);
      }
    }

    expect(container.textContent).not.toContain('§');
    expect(screen.queryByText(/Ver publicacións/i)).not.toBeInTheDocument();
  });

  it('includes 100% of tags in every responsive row layout (2 mobile, 3 tablet, 4 desktop)', () => {
    const dict = getDictionaryClient('gl');
    const tags = makeTags(12);

    render(<TagsSection lang="gl" dict={dict.tags} tags={tags} />);

    for (const rowCount of [2, 3, 4]) {
      const layout = screen.getByTestId(`tags-marquee-${rowCount}-rows`);
      const rows = within(layout).getAllByRole('list');
      expect(rows).toHaveLength(rowCount);

      const renderedNames = new Set(
        within(layout)
          .getAllByRole('link')
          .map((link) => link.textContent?.trim())
      );

      for (const tag of tags) {
        expect(renderedNames.has(tag.name)).toBe(true);
      }
    }
  });

  it('pads sparse short-label rows enough to cover wide viewports without blank gaps', () => {
    const dict = getDictionaryClient('gl');
    const shortTags: TagItem[] = [
      { id: '1', slug: 'ai', name: 'AI' },
      { id: '2', slug: 'go', name: 'GO' },
    ];

    render(<TagsSection lang="gl" dict={dict.tags} tags={shortTags} />);

    const desktopLayout = screen.getByTestId('tags-marquee-4-rows');
    expect(within(desktopLayout).getAllByRole('link')).toHaveLength(shortTags.length);

    const rows = within(desktopLayout).getAllByRole('list');
    for (const row of rows) {
      expect(row.querySelectorAll('a').length).toBeGreaterThanOrEqual(16);
    }
  });

  it('falls back to localized dictionary list with normalized slugs and routes to active locale', () => {
    const esDict = getDictionaryClient('es');

    render(<TagsSection lang="es" dict={esDict.tags} tags={[]} />);

    expect(screen.getByRole('heading', { name: esDict.tags.title })).toBeInTheDocument();
    expect(screen.getByText(esDict.tags.tag)).toBeInTheDocument();

    const exploreLink = screen.getByRole('link', {
      name: new RegExp(esDict.tags.exploreButton, 'i'),
    });
    expect(exploreLink).toHaveAttribute('href', '/es/articulos');

    const firstFallback = esDict.tags.list[0];
    const desktopLayout = screen.getByTestId('tags-marquee-4-rows');
    const fallbackLinks = within(desktopLayout).getAllByRole('link', { name: firstFallback });
    expect(fallbackLinks[0]).toHaveAttribute(
      'href',
      `/es/articulos?tema=${encodeURIComponent(slugify(firstFallback))}`
    );
  });
});
