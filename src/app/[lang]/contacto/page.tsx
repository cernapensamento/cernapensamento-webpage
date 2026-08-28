import React from 'react';
import ContactForm from '@/components/forms/ContactForm';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';
import PublicNavBar from '@/components/layout/PublicNavBar';

export default async function ContactoPage({ params }: { params: Promise<{ lang: string }> }) {
    const resolvedParams = await params;
    const dict = await getDictionary(resolvedParams.lang as Locale);

    return (
        <>
        <PublicNavBar />
        <main className="grow w-full max-w-4xl mx-auto px-5 md:px-16 py-24">
            <header className="text-center max-w-3xl mx-auto mb-20">
                <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-6">{dict.contactoPage.title}</h1>
                <p className="font-sans text-lg text-charcoal/70 max-w-2xl mx-auto">
                    {dict.contactoPage.description}
                </p>
            </header>
            <ContactForm />
        </main>
        </>
    );
}
