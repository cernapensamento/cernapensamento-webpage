import React from 'react';
import { getAuthenticatedUser } from '@/utils/auth';
import { redirect } from 'next/navigation';
import SideNavBar from '@/components/escritorio/SideNavBar';
import MobileBottomNav from '@/components/escritorio/MobileBottomNav';

export default async function EscritorioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-parchment text-charcoal font-sans">
      {/* SideNavBar Shell */}
      <SideNavBar role={profile?.rol} />

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto bg-parchment md:ml-64 flex flex-col relative h-screen">
        {/* Child Pages (Dashboard, Editor, Profile) */}
        {children}
      </div>

      {/* Mobile Navigation (Bottom Bar) */}
      <MobileBottomNav role={profile?.rol} />
    </div>
  );
}
