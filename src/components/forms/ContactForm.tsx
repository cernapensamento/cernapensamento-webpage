"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

export default function ContactForm() {
    const params = useParams();
    const routeLang = (params?.lang as string) || 'es';
    const dict = routeLang === 'gl' ? glDict.contactForm : esDict.contactForm;

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        // Basic validation
        const formErrors: { [key: string]: string } = {};
        if (!formData.get('fullName')) formErrors.fullName = 'Requerido';
        if (!formData.get('email')) formErrors.email = 'Requerido';
        if (!formData.get('message')) formErrors.message = 'Requerido';

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setStatus('loading');
        
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al enviar');
            }

            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message);
        }
    };

    if (status === 'success') {
        return (
            <div className="p-8 bg-surface-container-low border border-lines text-center" role="status" aria-live="polite">
                <span className="material-symbols-outlined text-4xl text-gold mb-4">check_circle</span>
                <h3 className="font-serif text-2xl text-charcoal mb-2">{dict.success}</h3>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8 bg-surface-container-lowest p-8 md:p-12 border border-lines relative shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gold opacity-30"></div>

            {status === 'error' && (
                <div role="alert" className="p-4 bg-error-container/20 border border-error/50 text-error font-sans text-sm">
                    {errorMessage}
                </div>
            )}

            <div>
                <label htmlFor="contact-fullName" className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-widest">
                    {dict.fullName} <span aria-hidden="true" className="text-error">*</span>
                </label>
                <input
                    id="contact-fullName"
                    name="fullName"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? "contact-fullName-error" : undefined}
                    className="w-full border-none border-b border-lines bg-transparent rounded-none px-0 py-2 focus:ring-0 focus:border-charcoal font-sans text-charcoal transition-colors"
                />
                {errors.fullName && <span id="contact-fullName-error" role="alert" className="text-error text-xs mt-1 block">{errors.fullName}</span>}
            </div>

            <div>
                <label htmlFor="contact-email" className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-widest">
                    {dict.email} <span aria-hidden="true" className="text-error">*</span>
                </label>
                <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "contact-email-error" : undefined}
                    className="w-full border-none border-b border-lines bg-transparent rounded-none px-0 py-2 focus:ring-0 focus:border-charcoal font-sans text-charcoal transition-colors"
                />
                {errors.email && <span id="contact-email-error" role="alert" className="text-error text-xs mt-1 block">{errors.email}</span>}
            </div>

            <div>
                <label htmlFor="contact-subject" className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-widest">
                    {dict.subject}
                </label>
                <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    className="w-full border-none border-b border-lines bg-transparent rounded-none px-0 py-2 focus:ring-0 focus:border-charcoal font-sans text-charcoal transition-colors"
                />
            </div>

            <div>
                <label htmlFor="contact-message" className="block font-sans text-xs font-semibold text-charcoal mb-1 uppercase tracking-widest">
                    {dict.message} <span aria-hidden="true" className="text-error">*</span>
                </label>
                <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    aria-required="true"
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    className="w-full p-3 border border-lines bg-surface-bright font-sans text-charcoal focus:ring-0 focus:border-charcoal resize-y transition-colors mt-2"
                ></textarea>
                {errors.message && <span id="contact-message-error" role="alert" className="text-error text-xs mt-1 block">{errors.message}</span>}
            </div>

            <div className="pt-6 border-t border-lines">
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-charcoal text-parchment py-4 px-8 font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors duration-300 flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    <span>{status === 'loading' ? dict.submitting : dict.submit}</span>
                    {!status && <span className="material-symbols-outlined text-sm">send</span>}
                </button>
            </div>
        </form>
    );
}
