import React from 'react';
import ArticleSubmissionForm from '@/components/forms/ArticleSubmissionForm';
import SiteFooter from '@/components/layout/SiteFooter';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';
import PublicNavBar from '@/components/layout/PublicNavBar';

export default async function ColaboraPage({ params }: { params: Promise<{ lang: string }> }) {
    const resolvedParams = await params;
    const dict = await getDictionary(resolvedParams.lang as Locale);

    return (
        <>
        <PublicNavBar />
        <main className="flex-grow w-full max-w-4xl mx-auto px-5 md:px-16 py-24">
            <header className="text-center max-w-3xl mx-auto mb-20">
                <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-6">{dict.colaboraPage.title}</h1>
                <p className="font-sans text-lg text-charcoal/70 max-w-2xl mx-auto">
                    {dict.colaboraPage.description}
                </p>
            </header>
            <ArticleSubmissionForm />
        </main>
        <SiteFooter variant="full" />
        </>
    );
}
