'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  children?: React.ReactNode;
  className?: string;
}

export default function ArticleScrollManager({ children, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollToElementWithOffset = (element: HTMLElement, smooth = true) => {
      const navbar = document.querySelector('nav.sticky') || document.querySelector('header');
      const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 96;
      // Generous breathing room so the screen stops well before the title appears
      const breathingRoom = 48;
      const totalOffset = navbarHeight + breathingRoom;

      const elementPosition = element.getBoundingClientRect().top;
      const currentScrollY = window.scrollY ?? window.pageYOffset ?? 0;
      const targetPosition = elementPosition + currentScrollY - totalOffset;

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: smooth ? 'smooth' : 'auto',
      });
    };

    const findTargetElement = (id: string): HTMLElement | null => {
      if (!id) return null;

      // 1. Direct ID match
      let el = document.getElementById(id);
      if (el) return el;

      // 2. Try with leading section numbers stripped (e.g. "2-como-se..." -> "como-se...")
      const stripped = id.replace(/^\d+(?:-\d+)*-/, '');
      if (stripped && stripped !== id) {
        el = document.getElementById(stripped);
        if (el) return el;
      }

      // 3. Search within container for heading elements whose id or stripped id matches
      const targets = container.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], span[id]');
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const tId = t.id;
        if (
          tId === id ||
          tId === stripped ||
          tId.replace(/^\d+(?:-\d+)*-/, '') === stripped ||
          tId.endsWith(`-${stripped}`) ||
          tId.endsWith(`-${id}`)
        ) {
          return t;
        }
      }

      return null;
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        try {
          const raw = href.slice(1);
          const id = decodeURIComponent(raw);
          const element = findTargetElement(id) || findTargetElement(raw);
          if (element) {
            e.preventDefault();
            scrollToElementWithOffset(element, true);
            window.history.pushState(null, '', `#${id}`);
          }
        } catch {
          // Fallback
        }
      }
    };

    container.addEventListener('click', handleClick);

    // Initial hash positioning on page load (with retries to handle font/image/KaTeX layout shifts)
    let activeTimer: NodeJS.Timeout | null = null;
    if (window.location.hash) {
      try {
        const raw = window.location.hash.slice(1);
        const hashId = decodeURIComponent(raw);

        const attemptScroll = (retriesLeft: number, delayMs: number) => {
          activeTimer = setTimeout(() => {
            const el = findTargetElement(hashId) || findTargetElement(raw);
            if (el) {
              scrollToElementWithOffset(el, true);
            } else if (retriesLeft > 0) {
              attemptScroll(retriesLeft - 1, delayMs * 1.5);
            }
          }, delayMs);
        };

        attemptScroll(4, 150);
      } catch {
        // Ignore malformed initial hash
      }
    }

    return () => {
      if (activeTimer) clearTimeout(activeTimer);
      container.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
