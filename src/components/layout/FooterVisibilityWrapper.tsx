"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export default function FooterVisibilityWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // SiteFooter is visible across all routes (including /escritorio).
  // Hidden only if specific recovery/auth routes require minimal layout.
  if (
    pathname?.includes('/actualizar-password') ||
    pathname?.includes('/recuperar-password')
  ) {
    return null;
  }

  return <>{children}</>;
}
