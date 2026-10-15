'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  threshold?: number;
  as?: React.ElementType;
}

export default function RevealOnScroll({
  children,
  className = '',
  delayMs = 0,
  threshold = 0.02,
  as: Component = 'div',
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(
    () => typeof window !== 'undefined' && typeof IntersectionObserver === 'undefined'
  );
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Safety fallback: reveal after 1.5s in case observer didn't trigger in background tab/screenshot
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(fallbackTimer);
          if (delayMs > 0) {
            const timer = setTimeout(() => {
              setIsVisible(true);
            }, delayMs);
            return () => clearTimeout(timer);
          } else {
            setIsVisible(true);
          }
          observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin: '120px 0px 0px 0px',
      }
    );

    observer.observe(el);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [delayMs, threshold]);

  return (
    <Component
      ref={elementRef}
      className={`reveal-init ${isVisible ? 'reveal-shown' : ''} ${className}`}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
