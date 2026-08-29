import React from 'react';
import { getDictionary } from '@/dictionaries';
import UnderConstructionBlock from '@/components/ui/UnderConstructionBlock';
import PublicNavBar from '@/components/layout/PublicNavBar';

export const metadata = {
  title: 'Noticias | Asociación Cerna Pensamento',
  description: 'Sección de noticias de la Asociación Cerna Pensamento.',
};

export default async function NoticiasPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "es" | "gl");
  
  // Example of passing a specific text to the WIP block, 
  // overriding the default text from the dictionary
  const customWipText = lang === 'gl' 
    ? "A nosa sección de novas e boletíns está en fase de desenvolvemento. Axiña teremos novidades!" 
    : "Nuestra sección de noticias y boletines está en fase de desarrollo. ¡Pronto tendremos novedades!";
    
  return (
    <>
      <PublicNavBar />
      <main className="flex-1 flex items-center justify-center min-h-[60vh]">
      <UnderConstructionBlock 
        dict={dict} 
        text={customWipText}
      />
    </main>
    </>
  );
}
