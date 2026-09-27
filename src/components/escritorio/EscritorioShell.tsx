'use client';

import React, { useState, useEffect } from 'react';
import SideNavBar from '@/components/escritorio/SideNavBar';
import MobileBottomNav from '@/components/escritorio/MobileBottomNav';

interface EscritorioShellProps {
  role?: string;
  children: React.ReactNode;
}

export default function EscritorioShell({ role, children }: EscritorioShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cerna_sidebar_collapsed');
      if (saved !== null) {
        setTimeout(() => {
          setCollapsed(saved === 'true');
        }, 0);
      }
    } catch {
      // LocalStorage access may fail in private mode
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cerna_sidebar_collapsed', String(next));
      } catch {
        // LocalStorage access may fail
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-parchment text-charcoal font-sans">
      {/* SideNavBar Shell */}
      <SideNavBar role={role} collapsed={collapsed} onToggle={toggleCollapse} />

      {/* Main Content Area */}
      <div
        className={`flex-grow overflow-y-auto bg-parchment transition-[margin] duration-300 ease-in-out ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        } flex flex-col relative h-screen`}
      >
        {children}
      </div>

      {/* Mobile Navigation (Bottom Bar) */}
      <MobileBottomNav role={role} />
    </div>
  );
}
