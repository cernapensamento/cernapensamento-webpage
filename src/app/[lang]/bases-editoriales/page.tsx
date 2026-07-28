import React from 'react';
import Link from 'next/link';
import PublicNavBar from '@/components/layout/PublicNavBar';
import SiteFooter from '@/components/layout/SiteFooter';
import BasesContentGL from '@/components/bases-editoriales/BasesContentGL';
import BasesContentES from '@/components/bases-editoriales/BasesContentES';

export const metadata = {
  title: 'Proxecto Editorial | Cerna',
  description: 'Criterios editoriais que regulan a elaboración, avaliación e publicación dos artigos semanais de CERNA.',
};

export default async function BasesEditoriales({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  const contentMap: Record<string, React.ReactNode> = {
    gl: <BasesContentGL />,
    es: <BasesContentES />,
  };
  
  const Content = contentMap[lang] || <BasesContentGL />;

  return (
    <div className="min-h-screen bg-parchment flex flex-col selection:bg-gold/20 selection:text-charcoal">
      <PublicNavBar />
      
      <main className="flex-grow pt-32 pb-24">
        <article className="max-w-[800px] mx-auto px-5 md:px-0">
          {Content}
        </article>
      </main>
      
      <SiteFooter variant="full" />
    </div>
  );
}
