"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

export default function ContactForm() {
    const params = useParams();
    const routeLang = (params?.lang as string) || 'es';
    const dict = routeLang === 'gl' ? glDict.contactForm : esDict.contactForm;

    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) {
            setFile(null);
            return;
        }

        if (selected.type !== 'application/pdf') {
            setErrors({ ...errors, file: dict.errorType });
            setFile(null);
            return;
        }
        if (selected.size > 3.5 * 1024 * 1024) {
            setErrors({ ...errors, file: dict.errorSize });
            setFile(null);
            return;
        }

        const newErrors = { ...errors };
        delete newErrors.file;
        setErrors(newErrors);
        setFile(selected);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        // Basic validation
        const formErrors: { [key: string]: string } = {};
        if (!formData.get('fullName')) formErrors.fullName = 'Requerido';
        if (!formData.get('email')) formErrors.email = 'Requerido';
        if (!formData.get('subject')) formErrors.subject = 'Requerido';
        if (!formData.get('message')) formErrors.message = 'Requerido';
        if (!formData.get('guidelines')) formErrors.guidelines = 'Requerido';

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
            <div className="p-8 bg-surface border border-lines text-center" role="status" aria-live="polite">
                <span className="material-symbols-outlined text-4xl text-gold mb-4">check_circle</span>
                <h3 className="font-serif text-2xl text-charcoal mb-2">{dict.success}</h3>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8 bg-surface p-8 md:p-12 border border-lines relative shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gold opacity-30"></div>

            {status === 'error' && (
                <div role="alert" className="p-4 bg-error-container/20 border border-error/50 text-error font-sans text-sm">
                    {errorMessage}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label htmlFor="fullName" className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-widest">
                        {dict.fullName} <span aria-hidden="true" className="text-error">*</span>
                    </label>
                    <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        aria-required="true"
                        aria-invalid={!!errors.fullName}
                        aria-describedby={errors.fullName ? "fullName-error" : undefined}
                        className="w-full border border-lines bg-parchment rounded-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold hover:border-gold/50 font-sans text-charcoal transition-colors"
                    />
                    {errors.fullName && <span id="fullName-error" role="alert" className="text-error text-xs mt-1 block">{errors.fullName}</span>}
                </div>

                <div>
                    <label htmlFor="email" className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-widest">
                        {dict.email} <span aria-hidden="true" className="text-error">*</span>
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        aria-required="true"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        className="w-full border border-lines bg-parchment rounded-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold hover:border-gold/50 font-sans text-charcoal transition-colors"
                    />
                    {errors.email && <span id="email-error" role="alert" className="text-error text-xs mt-1 block">{errors.email}</span>}
                </div>
            </div>

            <div>
                <label htmlFor="subject" className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-widest">
                    {dict.subject} <span aria-hidden="true" className="text-error">*</span>
                </label>
                <div className="relative">
                    <select
                        id="subject"
                        name="subject"
                        required
                        aria-required="true"
                        aria-invalid={!!errors.subject}
                        aria-describedby={errors.subject ? "subject-error" : undefined}
                        className="w-full border border-lines bg-parchment rounded-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold hover:border-gold/50 font-sans text-charcoal transition-colors appearance-none cursor-pointer"
                        defaultValue=""
                    >
                        <option value="" disabled>{dict.subjects.placeholder}</option>
                        <option value={dict.subjects.article}>{dict.subjects.article}</option>
                        <option value={dict.subjects.association}>{dict.subjects.association}</option>
                        <option value={dict.subjects.question}>{dict.subjects.question}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-charcoal/50 pointer-events-none" aria-hidden="true">expand_more</span>
                </div>
                {errors.subject && <span id="subject-error" role="alert" className="text-error text-xs mt-1 block">{errors.subject}</span>}
            </div>

            <div>
                <label htmlFor="message" className="block font-sans text-xs font-semibold text-charcoal mb-1 uppercase tracking-widest">
                    {dict.message} <span aria-hidden="true" className="text-error">*</span>
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    aria-required="true"
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    className="w-full p-3 border border-lines bg-parchment font-sans text-charcoal focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold hover:border-gold/50 resize-y transition-colors mt-2"
                ></textarea>
                {errors.message && <span id="message-error" role="alert" className="text-error text-xs mt-1 block">{errors.message}</span>}
            </div>

            <div>
                <label htmlFor="file-upload" className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-widest">
                    {dict.fileUpload}
                </label>
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-lines border-dashed hover:border-gold transition-colors focus-within:border-gold">
                    <div className="space-y-1 text-center">
                        <span className="material-symbols-outlined text-4xl text-charcoal/40 mb-2">upload_file</span>
                        <div className="flex text-sm text-charcoal/60 justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer font-sans text-gold hover:text-charcoal focus-within:outline-none focus-within:underline transition-colors">
                                <span>{file ? file.name : dict.selectFile}</span>
                                <input
                                    id="file-upload"
                                    name="file"
                                    type="file"
                                    accept=".pdf"
                                    aria-invalid={!!errors.file}
                                    aria-describedby={errors.file ? "file-error" : "file-desc"}
                                    className="sr-only"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                        <p id="file-desc" className="text-xs text-charcoal/50">{dict.uploadDesc}</p>
                    </div>
                </div>
                {errors.file && <span id="file-error" role="alert" className="text-error text-xs mt-1 block">{errors.file}</span>}
            </div>

            <div className="pt-6 border-t border-lines">
                <div className="flex items-start mb-8">
                    <div className="flex items-center h-5">
                        <input
                            id="guidelines"
                            name="guidelines"
                            type="checkbox"
                            required
                            aria-required="true"
                            aria-invalid={!!errors.guidelines}
                            aria-describedby={errors.guidelines ? "guidelines-error" : undefined}
                            className="appearance-none h-5 w-5 border border-lines bg-parchment dark:bg-lines rounded-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gold hover:border-gold transition-colors checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22><path%20fill=%22none%22%20stroke=%22%23c5a059%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20stroke-width=%222%22%20d=%22M4%208.5l2.5%202.5l5.5-5.5%22/></svg>')] checked:bg-no-repeat checked:bg-center checked:bg-[length:100%_100%]"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="guidelines" className="font-sans text-xs text-charcoal/80 cursor-pointer hover:text-charcoal select-none transition-colors">
                            {dict.agreement}
                        </label>
                        {errors.guidelines && <span id="guidelines-error" role="alert" className="text-error text-xs mt-1 block">{errors.guidelines}</span>}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-gold text-parchment py-4 px-8 font-sans text-xs uppercase tracking-widest hover:bg-charcoal transition-colors duration-300 flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    <span>{status === 'loading' ? dict.submitting : dict.submit}</span>
                    {!status && <span className="material-symbols-outlined text-sm">send</span>}
                </button>
            </div>
        </form>
    );
}
