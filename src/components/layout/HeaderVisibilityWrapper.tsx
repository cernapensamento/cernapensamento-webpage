"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export default function HeaderVisibilityWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide the header only on password update/recovery routes
  if (
    pathname?.includes('/actualizar-password') ||
    pathname?.includes('/recuperar-password')
  ) {
    return null;
  }

  return <>{children}</>;
}
