'use client';

import React from 'react';

interface EscritorioShellProps {
  role?: string;
  children: React.ReactNode;
}

export default function EscritorioShell({ children }: EscritorioShellProps) {
  return (
    <div className="w-full flex-grow flex flex-col bg-parchment text-charcoal font-sans">
      <div className="w-full flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
}
