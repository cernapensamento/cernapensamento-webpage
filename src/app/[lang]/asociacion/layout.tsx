import PublicNavBar from '@/components/layout/PublicNavBar';
import React from 'react';

export default function ProyectoEditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNavBar />
      {children}
    </>
  );
}
