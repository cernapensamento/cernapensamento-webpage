import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi, afterEach } from 'vitest';
import React from 'react';

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Polyfill DOM geometry APIs required by ProseMirror/TipTap in jsdom
if (typeof Range !== 'undefined') {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () =>
      ({
        length: 0,
        item: () => null,
        [Symbol.iterator]: function* () {},
      }) as DOMRectList;
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      }) as DOMRect;
  }
}
if (typeof Element !== 'undefined') {
  if (!Element.prototype.getClientRects) {
    Element.prototype.getClientRects = () =>
      ({
        length: 0,
        item: () => null,
        [Symbol.iterator]: function* () {},
      }) as DOMRectList;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/gl',
  useParams: () => ({ lang: 'gl' }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Link component to simple <a> tag in tests
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    return React.createElement('a', { href, ...rest }, children);
  },
}));
