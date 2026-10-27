import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormattedDate from './FormattedDate';

describe('FormattedDate component', () => {
  it('renders Galician short date correctly in a semantic <time> tag', () => {
    const rawIso = '2026-10-26T19:18:26.079445+00:00';
    render(<FormattedDate date={rawIso} lang="gl" format="short" className="custom-class" />);

    const timeElement = screen.getByText('26 de out. de 2026');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement.tagName.toLowerCase()).toBe('time');
    expect(timeElement).toHaveAttribute('dateTime', rawIso);
    expect(timeElement).toHaveClass('custom-class');
  });

  it('renders Spanish short date correctly', () => {
    const rawIso = '2026-10-26T19:18:26.079445+00:00';
    render(<FormattedDate date={rawIso} lang="es" format="short" />);

    const timeElement = screen.getByText('26 oct 2026');
    expect(timeElement).toBeInTheDocument();
  });

  it('renders Galician long date correctly', () => {
    const rawIso = '2026-10-26T19:18:26.079445+00:00';
    render(<FormattedDate date={rawIso} lang="gl" format="long" />);

    const timeElement = screen.getByText('26 de outubro de 2026');
    expect(timeElement).toBeInTheDocument();
  });

  it('renders Spanish long date correctly', () => {
    const rawIso = '2026-10-26T19:18:26.079445+00:00';
    render(<FormattedDate date={rawIso} lang="es" format="long" />);

    const timeElement = screen.getByText('26 de octubre de 2026');
    expect(timeElement).toBeInTheDocument();
  });

  it('accepts Date objects and generates valid ISO dateTime attribute', () => {
    const dateObj = new Date(Date.UTC(2026, 3, 14));
    render(<FormattedDate date={dateObj} lang="gl" format="long" />);

    const timeElement = screen.getByText('14 de abril de 2026');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveAttribute('dateTime', '2026-04-14T00:00:00.000Z');
  });

  it('returns null and renders nothing for null or invalid dates', () => {
    const { container: c1 } = render(<FormattedDate date={null} lang="gl" />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<FormattedDate date={undefined} lang="es" />);
    expect(c2.firstChild).toBeNull();

    const { container: c3 } = render(<FormattedDate date="not-a-date" lang="gl" />);
    expect(c3.firstChild).toBeNull();
  });
});
