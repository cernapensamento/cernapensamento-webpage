'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient, type Dictionary } from '@/dictionaries/client';

export type ContactFormDict = Dictionary['contactForm'];

interface ContactFormProps {
  dict?: Partial<ContactFormDict>;
  lang?: string;
}

const CONTACT_API_ENDPOINT = '/api/contact';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PDF_MIME_TYPE = 'application/pdf';
const BYTES_PER_MB = 1024 * 1024;
const MAX_PDF_SIZE_BYTES = 3.5 * BYTES_PER_MB;

const LABEL_CLASS =
  'block font-mono text-[11px] font-semibold text-charcoal/80 mb-2 uppercase tracking-widest';
const INPUT_CLASS =
  'w-full border border-lines bg-parchment rounded-none px-4 py-3 font-sans text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors';

function validateContactFormData(
  formData: FormData,
  dict: ContactFormDict
): Record<string, string> {
  const formErrors: Record<string, string> = {};
  const fullNameVal = formData.get('fullName')?.toString().trim();
  const emailVal = formData.get('email')?.toString().trim();
  const subjectVal = formData.get('subject')?.toString().trim();
  const messageVal = formData.get('message')?.toString().trim();
  const guidelinesVal = formData.get('guidelines');

  if (!fullNameVal) {
    formErrors.fullName = dict.requiredName;
  }
  if (!emailVal) {
    formErrors.email = dict.requiredEmail;
  } else if (!EMAIL_REGEX.test(emailVal)) {
    formErrors.email = dict.invalidEmail || dict.requiredEmail;
  }
  if (!subjectVal) {
    formErrors.subject = dict.requiredSubject;
  }
  if (!messageVal) {
    formErrors.message = dict.requiredMessage;
  }
  if (!guidelinesVal) {
    formErrors.guidelines = dict.requiredGuidelines;
  }

  return formErrors;
}

function resolveContactApiError(
  code: string | undefined,
  httpStatus: number,
  dict: ContactFormDict
): string {
  if (httpStatus === 429) {
    return dict.rateLimited || dict.genericError;
  }

  const errorByCode: Record<string, string> = {
    invalid_email: dict.invalidEmail || dict.requiredEmail,
    too_long: dict.tooLong || dict.genericError,
    invalid_file: dict.errorType,
    file_too_large: dict.errorSize,
    send_failed: dict.sendFailed || dict.genericError,
  };

  return (code && errorByCode[code]) || dict.genericError;
}

function RequiredLabel({ htmlFor, text }: { htmlFor: string; text: string }) {
  return (
    <label htmlFor={htmlFor} className={LABEL_CLASS}>
      {text} <span aria-hidden="true" className="text-gold font-bold">*</span>
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} role="alert" className="text-error text-xs mt-1.5 block">
      {message}
    </span>
  );
}

function ContactSuccessView({
  dict,
  onReset,
}: {
  dict: ContactFormDict;
  onReset: () => void;
}) {
  return (
    <div
      className="p-10 sm:p-14 bg-surface border border-lines text-center shadow-sm relative overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
      <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 mx-auto flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-3xl text-gold" aria-hidden="true">
          check
        </span>
      </div>
      <h3 className="font-serif text-2xl sm:text-3xl text-charcoal font-semibold mb-3">
        {dict.success}
      </h3>
      <p className="font-sans text-sm sm:text-base text-charcoal/70 max-w-md mx-auto mb-8 leading-relaxed">
        {dict.successNote}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="btn-outline text-xs tracking-[0.16em] uppercase font-bold py-3 px-6 inline-flex items-center gap-2"
      >
        <span>{dict.sendAnother}</span>
        <span className="material-symbols-outlined text-base" aria-hidden="true">
          refresh
        </span>
      </button>
    </div>
  );
}

export default function ContactForm({ dict: propDict, lang: propLang }: ContactFormProps) {
  const detectedLang = useLocale();
  const routeLang = propLang || detectedLang;
  const fallbackDict = getDictionaryClient(routeLang).contactForm;
  const dict: ContactFormDict = {
    ...fallbackDict,
    ...propDict,
    subjects: {
      ...fallbackDict.subjects,
      ...propDict?.subjects,
    },
  };

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    if (!errors[fieldName]) return;
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.type !== PDF_MIME_TYPE) {
      setErrors((prev) => ({ ...prev, file: dict.errorType }));
      setFile(null);
      return;
    }

    if (selected.size > MAX_PDF_SIZE_BYTES) {
      setErrors((prev) => ({ ...prev, file: dict.errorSize }));
      setFile(null);
      return;
    }

    clearFieldError('file');
    setFile(selected);
  };

  const handleRemoveFile = () => {
    setFile(null);
    clearFieldError('file');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const formErrors = validateContactFormData(formData, dict);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Ensure the attached file from React state is explicitly included in FormData,
    // overcoming the DOM unmount behavior when a file is selected.
    formData.delete('file');
    if (file) {
      formData.set('file', file, file.name);
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(CONTACT_API_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(resolveContactApiError(data.error, res.status, dict));
      }

      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : dict.genericError);
    }
  };

  if (status === 'success') {
    return (
      <ContactSuccessView
        dict={dict}
        onReset={() => {
          setStatus('idle');
          setFile(null);
          setErrors({});
        }}
      />
    );
  }

  const subjectOptions = [
    dict.subjects.article,
    dict.subjects.association,
    dict.subjects.question,
  ];

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-7 bg-surface p-6 sm:p-10 md:p-12 border border-lines relative shadow-sm"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gold opacity-50" />

      {/* Honeypot field for spam prevention (hidden from real users) */}
      <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
        <label htmlFor="contact-form-website">{dict.honeypotLabel}</label>
        <input
          id="contact-form-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {status === 'error' && (
        <div
          role="alert"
          className="p-4 bg-error-container/20 border border-error/50 text-error font-sans text-xs sm:text-sm flex items-start gap-3"
        >
          <span className="material-symbols-outlined text-lg shrink-0 mt-0.5" aria-hidden="true">
            error
          </span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Row 1: Full Name & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <RequiredLabel htmlFor="fullName" text={dict.fullName} />
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            aria-required="true"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            onChange={() => clearFieldError('fullName')}
            className={INPUT_CLASS}
          />
          <FieldError id="fullName-error" message={errors.fullName} />
        </div>

        <div>
          <RequiredLabel htmlFor="email" text={dict.email} />
          <input
            id="email"
            name="email"
            type="email"
            required
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            onChange={() => clearFieldError('email')}
            className={INPUT_CLASS}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>
      </div>

      {/* Row 2: Subject Dropdown */}
      <div>
        <RequiredLabel htmlFor="subject" text={dict.subject} />
        <div className="relative">
          <select
            id="subject"
            name="subject"
            required
            aria-required="true"
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            onChange={() => clearFieldError('subject')}
            className={`${INPUT_CLASS} pr-10 appearance-none cursor-pointer`}
            defaultValue=""
          >
            <option value="" disabled>
              {dict.subjects.placeholder}
            </option>
            {subjectOptions.map((optionLabel) => (
              <option key={optionLabel} value={optionLabel}>
                {optionLabel}
              </option>
            ))}
          </select>
          <span
            className="material-symbols-outlined absolute right-3 top-3 text-charcoal/50 pointer-events-none text-xl"
            aria-hidden="true"
          >
            expand_more
          </span>
        </div>
        <FieldError id="subject-error" message={errors.subject} />
      </div>

      {/* Row 3: Message Textarea */}
      <div>
        <RequiredLabel htmlFor="message" text={dict.message} />
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          onChange={() => clearFieldError('message')}
          className="w-full p-4 border border-lines bg-parchment font-sans text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold resize-y transition-colors"
        />
        <FieldError id="message-error" message={errors.message} />
      </div>

      {/* Row 4: File Upload (PDF Optional) */}
      <div>
        <label htmlFor="file-upload" className={LABEL_CLASS}>
          {dict.fileUpload}
        </label>

        {file ? (
          <div className="flex items-center justify-between p-3.5 bg-parchment border border-gold/60">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="material-symbols-outlined text-gold text-2xl shrink-0" aria-hidden="true">
                picture_as_pdf
              </span>
              <div className="min-w-0">
                <span className="font-sans text-xs font-semibold text-charcoal truncate block">
                  {file.name}
                </span>
                <span className="font-mono text-[10px] text-charcoal/60">
                  {(file.size / BYTES_PER_MB).toFixed(2)} MB
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-charcoal/50 hover:text-error transition-colors p-1"
              aria-label={dict.removeFile}
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-lines border-dashed hover:border-gold/60 bg-parchment/40 hover:bg-parchment transition-all">
            <div className="space-y-2 text-center">
              <span className="material-symbols-outlined text-3xl text-charcoal/40" aria-hidden="true">
                upload_file
              </span>
              <div className="flex text-xs text-charcoal/70 justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer font-sans font-semibold text-gold hover:text-charcoal transition-colors underline underline-offset-2"
                >
                  <span>{dict.selectFile}</span>
                  <input
                    id="file-upload"
                    name="file"
                    type="file"
                    accept=".pdf"
                    aria-invalid={!!errors.file}
                    aria-describedby={errors.file ? 'file-error' : 'file-desc'}
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p id="file-desc" className="text-[11px] font-mono text-charcoal/50">
                {dict.uploadDesc}
              </p>
            </div>
          </div>
        )}

        <FieldError id="file-error" message={errors.file} />
      </div>

      {/* Row 5: Agreement Checkbox & Submit */}
      <div className="pt-6 border-t border-lines flex flex-col gap-6">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="guidelines"
              name="guidelines"
              type="checkbox"
              required
              aria-required="true"
              aria-invalid={!!errors.guidelines}
              aria-describedby={errors.guidelines ? 'guidelines-error' : undefined}
              onChange={() => clearFieldError('guidelines')}
              className="appearance-none h-4.5 w-4.5 border border-lines bg-parchment rounded-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gold hover:border-gold transition-colors checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22><path%20fill=%22none%22%20stroke=%22%23c5a059%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20stroke-width=%222%22%20d=%22M4%208.5l2.5%202.5l5.5-5.5%22/></svg>')] checked:bg-no-repeat checked:bg-center checked:bg-[length:100%_100%]"
            />
          </div>
          <div className="ml-3 text-xs leading-relaxed">
            <label
              htmlFor="guidelines"
              className="font-sans text-charcoal/80 cursor-pointer hover:text-charcoal select-none transition-colors"
            >
              {dict.agreement}
            </label>{' '}
            <Link
              href={`/${routeLang}/privacidad`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-gold underline decoration-gold/40 underline-offset-2 transition-colors hover:text-charcoal font-semibold inline-block"
            >
              {dict.privacyLink}
            </Link>
            <FieldError id="guidelines-error" message={errors.guidelines} />
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary w-full py-4 text-xs font-sans uppercase tracking-[0.2em] font-bold inline-flex items-center justify-center gap-3 transition-all duration-300 group cursor-pointer disabled:opacity-50"
        >
          <span>{status === 'loading' ? dict.submitting : dict.submit}</span>
          <span
            className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          >
            {status === 'loading' ? 'hourglass_top' : 'arrow_forward'}
          </span>
        </button>
      </div>
    </form>
  );
}
