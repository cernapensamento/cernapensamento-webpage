'use client';

import React, { useSyncExternalStore } from 'react';
import Image from 'next/image';

interface HeroAnimatedLogoProps {
  className?: string;
}

const subscribeReducedMotion = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

const getReducedMotionSnapshot = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const getReducedMotionServerSnapshot = () => false;

export default function HeroAnimatedLogo({ className = '' }: HeroAnimatedLogoProps) {
  // Single-loop GIFs natively play once and freeze permanently on the final frame.
  // For users with prefers-reduced-motion, we render the static lossless last frame directly.
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Light Theme: Presentation Animation (single-loop GIF stops and stays on last frame) */}
      <div className="relative w-full h-full block dark:hidden">
        <Image
          src={
            prefersReducedMotion
              ? '/images/hero/cerna-presentation-last-frame.webp'
              : '/images/hero/cerna-presentation.gif'
          }
          alt="Cerna Pensamento"
          fill
          unoptimized
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 1000px"
          className="object-contain"
        />
      </div>

      {/* Dark Theme: Presentation Animation (single-loop Dark GIF stops and stays on last frame) */}
      <div className="relative w-full h-full hidden dark:block">
        <Image
          src={
            prefersReducedMotion
              ? '/images/hero/cerna-presentation-dark-last-frame.webp'
              : '/images/hero/cerna-presentation-dark.gif'
          }
          alt="Cerna Pensamento"
          fill
          unoptimized
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 1000px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
