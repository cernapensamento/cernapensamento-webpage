"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

export default function ArticleSubmissionForm() {
    const params = useParams();
    const routeLang = (params?.lang as string) || 'es';
    // Use fallback strings since we haven't added to dicts yet
    const dict = routeLang === 'gl' ? glDict.articleSubmission : esDict.articleSubmission;

    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

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
        if (!formData.get('abstract')) formErrors.abstract = 'Requerido';
        if (!file) formErrors.file = 'Requerido';
        if (!formData.get('guidelines')) formErrors.guidelines = 'Requerido';

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setStatus('loading');
        
        try {
            const res = await fetch('/api/submit-article', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al enviar');
            }

            setStatus('success');
        } catch (err: unknown) {
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
            {/* Decorative subtle top border line simulating a document */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gold opacity-30"></div>

            {status === 'error' && (
                <div role="alert" className="p-4 bg-error-container/20 border border-error/50 text-error font-sans text-sm">
                    {errorMessage}
                </div>
            )}

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

            <div>
                <label htmlFor="abstract" className="block font-sans text-xs font-semibold text-charcoal mb-1 uppercase tracking-widest">
                    {dict.abstract} <span aria-hidden="true" className="text-error">*</span>
                </label>
                <p className="font-sans text-xs text-charcoal/60 mb-3" id="abstract-desc">{dict.abstractDesc}</p>
                <textarea
                    id="abstract"
                    name="abstract"
                    required
                    rows={4}
                    aria-required="true"
                    aria-invalid={!!errors.abstract}
                    aria-describedby={errors.abstract ? "abstract-error" : "abstract-desc"}
                    className="w-full p-3 border border-lines bg-parchment font-sans text-charcoal focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold hover:border-gold/50 resize-y transition-colors"
                ></textarea>
                {errors.abstract && <span id="abstract-error" role="alert" className="text-error text-xs mt-1 block">{errors.abstract}</span>}
            </div>

            <div>
                <label htmlFor="file-upload" className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-widest">
                    {dict.fileUpload} <span aria-hidden="true" className="text-error">*</span>
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
                                    required
                                    aria-required="true"
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
                    {!status && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                </button>
            </div>
        </form>
    );
}
