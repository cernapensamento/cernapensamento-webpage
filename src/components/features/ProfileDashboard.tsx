'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import PasswordForm from '@/components/forms/PasswordForm';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import { handleSignOut } from '@/actions/auth';
import { clearClientDrafts } from '@/lib/editor/draftStorage';
import { getDictionaryClient } from '@/dictionaries/client';
import { i18n } from '@/i18n-config';
import { useLocale } from '@/hooks/useLocale';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import { USER_COLS, resolveRoleLabel } from '@/lib/db/schema';
import type { UserRow } from '@/lib/db/types';
import { updateUserProfile } from '@/lib/db';
import { uploadStorageImage, removeStorageImages, STORAGE_CATEGORIES } from '@/lib/storage';
import FormattedDate from '@/components/ui/FormattedDate';
import { useToast } from '@/components/ui/FeedbackProvider';

export interface ProfileDashboardProps {
  profile: (UserRow & { rol?: string; nombre?: string; recibir_newsletter?: boolean }) | null;
  user: User;
}

type StatusMessage = { type: 'success' | 'error'; text: string } | null;

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string' &&
    (error as { message: string }).message.length > 0
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

export default function ProfileDashboard({ profile, user }: ProfileDashboardProps) {
  const lang = useLocale();
  const dict = getDictionaryClient(lang);
  const dashDict = dict.dashboard;
  const storageDict = dict.escritorio.storage;
  const toast = useToast();

  const currentBio = resolveLocalizedText(profile?.bio, lang);

  const [nombre, setNombre] = useState(profile?.full_name || profile?.nombre || '');
  const [bio, setBio] = useState(currentBio);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [recibirNewsletter, setRecibirNewsletter] = useState(profile?.newsletter_subscribed ?? profile?.recibir_newsletter ?? false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isEmailAuth = user?.app_metadata?.providers?.includes('email');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const targetUserId = profile?.id || user?.id;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const bioPayload =
        typeof profile?.bio === 'object' && profile?.bio !== null
          ? { ...profile.bio, [lang]: bio }
          : Object.fromEntries(i18n.locales.map((loc) => [loc, bio]));

      const { error } = await updateUserProfile(
        targetUserId,
        {
          [USER_COLS.FULL_NAME]: nombre,
          [USER_COLS.BIO]: bioPayload,
          [USER_COLS.AVATAR_URL]: avatarUrl,
          [USER_COLS.NEWSLETTER_SUBSCRIBED]: recibirNewsletter,
        },
        supabase
      );

      if (error) throw error;
      setStatusMessage({ type: 'success', text: dashDict.profileSaved });
      window.dispatchEvent(new Event('profile_updated'));
      router.refresh();
    } catch (error: unknown) {
      const msg = extractErrorMessage(error, dashDict.unknownError);
      setStatusMessage({
        type: 'error',
        text: `${dashDict.updateErrorPrefix} ${msg}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const localPreview = URL.createObjectURL(file);
    const oldAvatar = profile?.avatar_url || avatarUrl;
    setAvatarUrl(localPreview);

    try {
      const { publicUrl } = await uploadStorageImage({
        file,
        category: STORAGE_CATEGORIES.PROFILE_AVATAR,
        userId: targetUserId,
      });

      setAvatarUrl(publicUrl);

      // Auto-save to DB immediately so refresh doesn't lose the new image
      const { error: updateError } = await updateUserProfile(
        targetUserId,
        { [USER_COLS.AVATAR_URL]: publicUrl },
        supabase
      );

      if (updateError) {
        console.error('Failed to save avatar in DB:', updateError.message);
      } else {
        if (oldAvatar && oldAvatar !== publicUrl) {
          removeStorageImages(supabase, [oldAvatar]).catch((err) =>
            console.error('Failed to cleanup previous avatar:', err)
          );
        }
        window.dispatchEvent(new Event('profile_updated'));
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '';
      if (errorMsg === 'INVALID_FORMAT') {
        toast.error(storageDict.invalidFormat);
      } else if (errorMsg.startsWith('FILE_TOO_LARGE:')) {
        const maxMb = errorMsg.split(':')[1] || '5';
        toast.error(storageDict.fileTooLarge.replace('{max}', maxMb));
      } else {
        toast.error(storageDict.uploadError.replace('{error}', errorMsg || dashDict.genericUploadError));
      }
      setAvatarUrl(profile?.avatar_url || '');
    } finally {
      URL.revokeObjectURL(localPreview);
      setIsUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-surface border border-lines p-6 sm:p-10 md:p-16">
      {/* Header Section (Avatar + Name) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-lines mb-6">
        <div className="flex items-center gap-6 sm:gap-8">
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarFileSelected}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 shrink-0 relative group overflow-hidden rounded-full border border-lines ${isUploading ? 'cursor-wait opacity-50 animate-pulse' : 'cursor-pointer'}`}
            onClick={!isUploading ? handleChangeAvatar : undefined}
            onKeyDown={!isUploading ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChangeAvatar(); } } : undefined}
            role="button"
            tabIndex={0}
            title={dashDict.changeAvatarAria}
            aria-label={dashDict.changeAvatarAria}
          >
            <Image
              className="object-cover transition-all group-hover:opacity-30"
              alt={dashDict.avatarAlt}
              src={avatarUrl || DEFAULT_AVATAR_URL}
              fill
              sizes="(max-width: 640px) 80px, 96px"
            />
            {!isUploading && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-charcoal/10">
                <span className="bg-charcoal text-parchment text-[10px] uppercase tracking-widest px-2 py-1 text-center font-sans">
                  {dashDict.changeAvatarLabel}
                </span>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-charcoal/30 pointer-events-none">
                <span className="material-symbols-outlined text-parchment animate-spin text-[24px]" aria-hidden="true">sync</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-2xl sm:text-3xl text-charcoal mb-1">{nombre || dashDict.personalData}</h3>
            <p className="font-sans text-[10px] sm:text-xs text-gold uppercase tracking-[0.2em] font-bold">
              {resolveRoleLabel(profile?.role || profile?.rol, dashDict)}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="text-left">
          {/* Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <span className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">
                {dashDict.emailLabel}
              </span>
              <span className="font-sans text-sm sm:text-base text-charcoal">{user?.email}</span>
            </div>
            <div>
              <span className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">
                {dashDict.joinDateLabel}
              </span>
              {user?.created_at ? (
                <FormattedDate
                  date={user.created_at}
                  lang={lang}
                  format="long"
                  className="font-sans text-sm sm:text-base text-charcoal/80"
                />
              ) : (
                <span className="font-sans text-sm sm:text-base text-charcoal/80">
                  {dashDict.unknownDate}
                </span>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form id="profile-form" onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">{dashDict.fullName}</label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-lines focus:outline-none focus:border-charcoal transition-colors rounded-none"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mb-1">{dashDict.bio}</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                rows={3}
                placeholder={dashDict.bioPlaceholder}
                className="w-full px-0 py-2 bg-transparent border-b border-lines text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-charcoal transition-colors rounded-none resize-none overflow-hidden min-h-[80px]"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="newsletter"
                checked={recibirNewsletter}
                onChange={(e) => setRecibirNewsletter(e.target.checked)}
                className="w-4 h-4 text-gold border-lines rounded focus:ring-gold accent-gold"
              />
              <label htmlFor="newsletter" className="font-sans text-sm text-charcoal cursor-pointer">
                {dashDict.newsletterText}
              </label>
            </div>
          </form>

          {/* Password Form */}
          {isEmailAuth && (
            <div className="pt-6 mt-6 text-left">
              <h4 className="font-serif text-xl text-charcoal mb-4">{dashDict.securitySectionTitle}</h4>
              <PasswordForm />
            </div>
          )}

          {statusMessage && (
            <div
              role={statusMessage.type === 'error' ? 'alert' : 'status'}
              className={`p-4 mt-6 text-sm ${
                statusMessage.type === 'error'
                  ? 'border border-red-200 bg-red-50 text-red-800'
                  : 'border border-green-200 bg-green-50 text-green-800'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 mt-8 border-t border-lines">
            <button
              type="submit"
              form="profile-form"
              disabled={loading || isUploading}
              className="group relative px-6 py-3 bg-charcoal text-parchment hover:bg-gold hover:text-charcoal transition-all duration-500 ease-out font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] disabled:opacity-50 border border-charcoal hover:border-gold overflow-hidden shrink-0 w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? dashDict.saving : dashDict.saveChanges}
                {!loading && <span className="material-symbols-outlined text-[14px] transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true">arrow_forward</span>}
              </span>
            </button>
            <form action={handleSignOut} onSubmit={clearClientDrafts} className="w-full sm:w-auto">
              <button
                type="submit"
                className="flex items-center justify-center gap-3 py-3 px-5 bg-transparent border border-lines/60 text-charcoal/60 hover:border-red-500/40 dark:hover:border-red-400/30 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 transition-all duration-300 group w-full cursor-pointer shrink-0 rounded-sm font-medium"
              >
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:-translate-x-1" data-icon="logout" aria-hidden="true">logout</span>
                <span className="font-sans text-xs uppercase tracking-[0.18em] transition-colors duration-300">{dashDict.logout}</span>
              </button>
            </form>
          </div>
        </div>
    </div>
  );
}
