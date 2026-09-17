"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export default function FooterVisibilityWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide the footer on all escritorio (dashboard) routes
  if (pathname?.includes('/escritorio')) {
    return null;
  }

  return <>{children}</>;
}
