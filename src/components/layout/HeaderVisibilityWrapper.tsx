"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export default function HeaderVisibilityWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide the header on dashboard and password update routes
  if (
    pathname?.includes('/escritorio') ||
    pathname?.includes('/actualizar-password') ||
    pathname?.includes('/recuperar-password')
  ) {
    return null;
  }

  return <>{children}</>;
}
