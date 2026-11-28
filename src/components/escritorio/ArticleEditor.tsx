"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import TableOfContents, { type TableOfContentData } from '@tiptap/extension-table-of-contents';
import 'katex/dist/katex.min.css';
import { Figure } from '@/lib/editor/FigureExtension';
import { MathKit } from '@/lib/editor/MathExtensions';
import {
  CustomTable,
  TableRow,
  CustomTableCell,
  CustomTableHeader,
} from '@/lib/editor/TableExtensions';
import { stripIndex, slugifyHeading } from '@/lib/editor/generateIndex';
import TableControls from '@/components/escritorio/TableControls';
import EditorToolbar from '@/components/escritorio/EditorToolbar';
import ArticleMetadataSection from '@/components/escritorio/ArticleMetadataSection';
import PublishConfirmModal from '@/components/escritorio/PublishConfirmModal';
import ArticlePreviewModal from '@/components/escritorio/ArticlePreviewModal';
import ArticleTableOfContents from '@/components/features/ArticleTableOfContents';
import { useToast, useConfirm, usePrompt } from '@/components/ui/FeedbackProvider';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';
import { createClient } from '@/lib/supabase/client';
import { i18n, isSupportedLocale, type Locale } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import {
  getAvailablePublicationLocales,
  getPublicationLanguageMode,
  hasMeaningfulHtmlContent,
  resolvePublicationLocale,
  type PublicationLanguageMode,
} from '@/lib/i18n/publicationLanguage';
import { getUserById, type LocalizedString, type UserRow } from '@/lib/db';
import {
  PUBLICATION_TYPES,
  EDITOR_ACTIONS,
  type EditorAction,
  type PermissionValue,
} from '@/lib/db/schema';
import {
  uploadStorageImage,
  removeStorageImages,
  STORAGE_CATEGORIES,
} from '@/lib/storage';
import { saveArticleAction } from '@/actions/articles';
import {
  type LocalizedFieldMap,
  createEmptyLocalizedMap,
  buildLocalizedMap,
  buildLiveTocItems,
  getStorageUploadErrorMessage,
  removeFigureBySrc,
  sanitizeBase64Images,
  collectSupersededStoragePaths,
  serializeDraft,
  parseDraft,
} from './articleEditorUtils';

export interface ArticleData {
  id?: string;
  title?: LocalizedString;
  subtitle?: LocalizedString | null;
  content?: LocalizedString;
  cover_image_url?: string | null;
  tags?: string[];
  status?: string;
  type?: string;
  original_language?: string;
  language_mode?: PublicationLanguageMode;
  show_index?: boolean;
  published_at?: string | null;
  // Backwards compatibility aliases
  titulo_gl?: string;
  titulo_es?: string;
  subtitulo_gl?: string;
  subtitulo_es?: string;
  contenido_gl?: string;
  contenido_es?: string;
  imagen_url?: string;
  tematicas?: string[];
  estado?: string;
  tipo?: string;
  fijado?: boolean;
  idioma_original?: string;
}

export { EDITOR_ACTIONS, type EditorAction };

export type OnSaveResult = boolean | { success: boolean } | void;

interface ArticleEditorProps {
  initialData?: ArticleData;
  onSave: (data: ArticleData, action: EditorAction) => Promise<OnSaveResult>;
  onDraftCreated?: (draft: { id: string; slug: string }) => void;
  isPublishing: boolean;
  mode: 'create' | 'edit';
  permissions?: readonly PermissionValue[];
}

export default function ArticleEditor({
  mode = 'create',
  initialData,
  onSave,
  onDraftCreated,
  isPublishing,
  permissions,
}: ArticleEditorProps) {
  const routeLang = useLocale();
  const routeDict = getDictionaryClient(routeLang);
  const dict = routeDict.articleEditor;
  const storageDict = routeDict.escritorio.storage;

  const toast = useToast();
  const confirm = useConfirm();
  const prompt = usePrompt();

  const initialTitles = useMemo(
    () =>
      buildLocalizedMap(initialData?.title, {
        gl: initialData?.titulo_gl,
        es: initialData?.titulo_es,
      }),
    [initialData?.title, initialData?.titulo_gl, initialData?.titulo_es]
  );

  const initialSubtitles = useMemo(
    () =>
      buildLocalizedMap(initialData?.subtitle, {
        gl: initialData?.subtitulo_gl,
        es: initialData?.subtitulo_es,
      }),
    [initialData?.subtitle, initialData?.subtitulo_gl, initialData?.subtitulo_es]
  );

  const initialRawContents = useMemo(
    () =>
      buildLocalizedMap(initialData?.content, {
        gl: initialData?.contenido_gl,
        es: initialData?.contenido_es,
      }),
    [initialData?.content, initialData?.contenido_gl, initialData?.contenido_es]
  );

  const initialCleanContents = useMemo(
    () =>
      Object.fromEntries(
        i18n.locales.map((loc) => [loc, stripIndex(initialRawContents[loc])])
      ) as LocalizedFieldMap,
    [initialRawContents]
  );

  const initialHasLegacyIndex = i18n.locales.some((loc) =>
    /data-type="article-index"/i.test(initialRawContents[loc])
  );

  const rawOrigLang = initialData?.original_language || initialData?.idioma_original;
  const normalizedOrigLang: Locale = isSupportedLocale(rawOrigLang)
    ? rawOrigLang
    : i18n.defaultLocale;

  const initialLanguageMode: PublicationLanguageMode =
    mode === 'edit' && initialData
      ? initialData.language_mode ??
        getPublicationLanguageMode({
          title: initialTitles,
          content: initialCleanContents,
          original_language: normalizedOrigLang,
        })
      : 'bilingual';

  const initialActiveLang: Locale =
    initialLanguageMode === 'monolingual'
      ? resolvePublicationLocale(
          {
            title: initialTitles,
            content: initialCleanContents,
            original_language: normalizedOrigLang,
          },
          normalizedOrigLang
        ).actualLocale
      : i18n.defaultLocale;

  const initialSavedLocales = useMemo<Locale[]>(
    () =>
      mode === 'edit' && initialData
        ? getAvailablePublicationLocales({
            title: initialTitles,
            content: initialCleanContents,
            original_language: normalizedOrigLang,
          })
        : [],
    [mode, initialData, initialTitles, initialCleanContents, normalizedOrigLang]
  );

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [languageMode, setLanguageMode] = useState<PublicationLanguageMode>(initialLanguageMode);
  const [activeLang, setActiveLang] = useState<Locale>(initialActiveLang);
  const [titles, setTitles] = useState<LocalizedFieldMap>(initialTitles);
  const [subtitles, setSubtitles] = useState<LocalizedFieldMap>(initialSubtitles);
  const [contents, setContents] = useState<LocalizedFieldMap>(initialCleanContents);
  const [showIndex, setShowIndex] = useState<boolean>(
    initialData?.show_index ?? initialHasLegacyIndex
  );
  const [tocData, setTocData] = useState<TableOfContentData>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const [idiomaOriginal, setIdiomaOriginal] = useState<Locale>(
    initialLanguageMode === 'monolingual' ? initialActiveLang : normalizedOrigLang
  );

  const activeLangRef = useRef<Locale>(activeLang);
  useEffect(() => {
    activeLangRef.current = activeLang;
  }, [activeLang]);

  const initialType = initialData?.type || initialData?.tipo;
  const [tipo, setTipo] = useState(initialType || PUBLICATION_TYPES.ARTICLE);
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url || initialData?.imagen_url || ''
  );
  const [tematicas, setTematicas] = useState<string[]>(
    initialData?.tags || initialData?.tematicas || []
  );
  const [showPreview, setShowPreview] = useState(false);

  const isUploadingCover = useRef(false);
  const isUploadingInline = useRef(false);
  const uploadedInlineImages = useRef<string[]>([]);
  const uploadedCoverImages = useRef<string[]>([]);
  const savedCoverUrlRef = useRef<string | null>(
    initialData?.cover_image_url || initialData?.imagen_url || null
  );
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);

  const [authorProfileRow, setAuthorProfileRow] = useState<UserRow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lazyPublicationId, setLazyPublicationId] = useState<string | undefined>(undefined);
  const publicationId = initialData?.id || lazyPublicationId;
  const publicationIdRef = useRef<string | undefined>(publicationId);
  const lazyDraftPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    publicationIdRef.current = publicationId;
  }, [publicationId]);

  useEffect(() => {
    const nextCover = initialData?.cover_image_url || initialData?.imagen_url;
    if (nextCover) {
      savedCoverUrlRef.current = nextCover;
    }
  }, [initialData?.cover_image_url, initialData?.imagen_url]);

  const supabase = useMemo(() => createClient(), []);

  const draftKey = publicationId
    ? `cerna_draft_${publicationId}`
    : `cerna_draft_${currentUserId ? `${currentUserId}_new` : 'new'}`;

  const prevDraftKeyRef = useRef(draftKey);
  const prevPublicationIdRef = useRef(publicationId);

  useEffect(() => {
    const prevKey = prevDraftKeyRef.current;
    const prevPubId = prevPublicationIdRef.current;
    prevDraftKeyRef.current = draftKey;
    prevPublicationIdRef.current = publicationId;

    if (!prevPubId && publicationId && prevKey !== draftKey && typeof window !== 'undefined') {
      try {
        const cachedDraft = localStorage.getItem(prevKey);
        if (cachedDraft !== null) {
          localStorage.setItem(draftKey, cachedDraft);
          localStorage.removeItem(prevKey);
        }
      } catch (err) {
        console.warn('[ArticleEditor] Failed to migrate cached draft key:', err);
      }
    }
  }, [draftKey, publicationId]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialCleanContentsRef = useRef(initialCleanContents);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isMounted || !user) return;
      setCurrentUserId(user.id);
      const profile = await getUserById(user.id, supabase);
      if (isMounted && profile) {
        setAuthorProfileRow(profile);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Figure,
      Youtube.configure({
        inline: false,
        width: 800,
        height: 450,
      }),
      TextStyle,
      FontSize,
      CustomTable,
      TableRow,
      CustomTableCell,
      CustomTableHeader,
      MathKit,
      TableOfContents.configure({
        getId: (textContent) => slugifyHeading(textContent) || 'section',
        onUpdate: (data) => {
          setTocData(data);
        },
      }),
    ],
    content:
      initialCleanContents[initialActiveLang] ||
      (mode === 'create'
        ? getDictionaryClient(initialActiveLang).articleEditor.defaultEditorContent
        : ''),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'w-full border-none bg-transparent font-sans text-xl text-charcoal focus:outline-none min-h-[400px] outline-none article-content',
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      const html = tiptapEditor.getHTML();
      const currentLocale = activeLangRef.current;
      setContents((prev) => ({ ...prev, [currentLocale]: html }));
    },
  });

  // Debounced auto-save to localStorage on any editor state change
  useEffect(() => {
    if (!editor || !isInitialized.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const serialized = serializeDraft({
        title: titles,
        subtitle: subtitles,
        content: contents,
        cover_image_url: coverImageUrl,
        tags: tematicas,
        type: tipo,
        original_language: idiomaOriginal,
        language_mode: languageMode,
        show_index: showIndex,
      });
      localStorage.setItem(draftKey, serialized);
      setHasUnsavedChanges(true);
    }, 1500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    titles,
    subtitles,
    contents,
    coverImageUrl,
    tematicas,
    tipo,
    idiomaOriginal,
    languageMode,
    showIndex,
    draftKey,
    editor,
  ]);

  // Restore saved localStorage draft once TipTap mounts
  useEffect(() => {
    if (!editor || isInitialized.current) return;
    isInitialized.current = true;

    const currentActiveLang = activeLangRef.current;
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const patch = parseDraft(savedDraft);
        if (patch) {
          setTimeout(() => {
            if (Object.keys(patch.titles).length > 0) {
              setTitles((prev) => ({ ...prev, ...patch.titles }));
            }
            if (Object.keys(patch.subtitles).length > 0) {
              setSubtitles((prev) => ({ ...prev, ...patch.subtitles }));
            }
            if (patch.type) setTipo(patch.type);
            if (patch.originalLanguage) setIdiomaOriginal(patch.originalLanguage);
            if (patch.languageMode) setLanguageMode(patch.languageMode);
            const monolingualLocale =
              patch.languageMode === 'monolingual' ? patch.originalLanguage : undefined;
            if (monolingualLocale) {
              activeLangRef.current = monolingualLocale;
              setActiveLang(monolingualLocale);
            }
            if (patch.coverImageUrl) setCoverImageUrl(patch.coverImageUrl);
            if (patch.tags) setTematicas(patch.tags);
            if (typeof patch.showIndex === 'boolean') setShowIndex(patch.showIndex);
            if (Object.keys(patch.contents).length > 0) {
              setContents((prev) => ({ ...prev, ...patch.contents }));
            }
            if (monolingualLocale) {
              editor.commands.setContent(
                patch.contents[monolingualLocale] ?? initialCleanContentsRef.current[monolingualLocale]
              );
            } else if (patch.contents[currentActiveLang]) {
              editor.commands.setContent(patch.contents[currentActiveLang]);
            }
            setHasUnsavedChanges(true);
          }, 0);
          return;
        }
      }
    }

    const savedActiveContent = initialCleanContentsRef.current[currentActiveLang];
    if (savedActiveContent) {
      editor.commands.setContent(savedActiveContent);
    }
  }, [editor, draftKey]);

  const handleSwitchLang = (nextLang: Locale) => {
    if (nextLang === activeLang) return;
    const currentHtml = editor?.getHTML();
    if (currentHtml !== undefined) {
      setContents((prev) => ({ ...prev, [activeLang]: stripIndex(currentHtml) }));
    }
    activeLangRef.current = nextLang;
    setActiveLang(nextLang);
    if (languageMode === 'monolingual') {
      setIdiomaOriginal(nextLang);
    }
    setTocData([]);
    const targetContent = stripIndex(contents[nextLang] || '');
    editor?.commands.setContent(targetContent);
  };

  const handleToggleLanguageMode = () => {
    setLanguageMode((prev) => {
      const next: PublicationLanguageMode = prev === 'bilingual' ? 'monolingual' : 'bilingual';
      if (next === 'monolingual') {
        setIdiomaOriginal(activeLang);
      }
      return next;
    });
  };

  const ensurePublicationId = async (options?: {
    coverUrl?: string | null;
  }): Promise<string | null> => {
    if (publicationIdRef.current) {
      return publicationIdRef.current;
    }

    if (lazyDraftPromiseRef.current) {
      return lazyDraftPromiseRef.current;
    }

    const createDraftPromise = (async (): Promise<string | null> => {
      try {
        const currentHtml = editor?.getHTML() || '';
        const draftContents: LocalizedFieldMap = {
          ...contents,
          [activeLangRef.current]: stripIndex(currentHtml),
        };
        const hasSubtitle = Object.values(subtitles).some((v) => Boolean(v?.trim()));
        const candidateCover =
          options?.coverUrl !== undefined ? options.coverUrl : coverImageUrl;
        const safeCoverUrl =
          candidateCover && !candidateCover.startsWith('blob:') ? candidateCover : null;

        const result = await saveArticleAction({
          title: { ...titles },
          subtitle: hasSubtitle ? { ...subtitles } : null,
          content: draftContents,
          cover_image_url: safeCoverUrl,
          tags: tematicas,
          type: tipo,
          original_language: idiomaOriginal,
          show_index: showIndex,
          action: EDITOR_ACTIONS.DRAFT,
          lang: routeLang,
        });

        if (!result.success || !result.id) {
          toast.error(result.error || dict.saveError);
          return null;
        }

        publicationIdRef.current = result.id;
        setLazyPublicationId(result.id);

        if (result.slug && typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState(
            null,
            '',
            `/${routeLang}/escritorio/editar/${result.slug}`
          );
        }

        onDraftCreated?.({ id: result.id, slug: result.slug || '' });
        return result.id;
      } catch (err: unknown) {
        console.error('[ArticleEditor] Lazy draft creation failed:', err);
        toast.error(dict.unexpectedError);
        return null;
      } finally {
        lazyDraftPromiseRef.current = null;
      }
    })();

    lazyDraftPromiseRef.current = createDraftPromise;
    return createDraftPromise;
  };

  const handleCoverFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previousCoverUrl = coverImageUrl;
    isUploadingCover.current = true;
    const localPreview = URL.createObjectURL(file);
    setCoverImageUrl(localPreview);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(storageDict.sessionRequired);
      setCoverImageUrl(previousCoverUrl);
      isUploadingCover.current = false;
      URL.revokeObjectURL(localPreview);
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    const targetPublicationId = await ensurePublicationId({
      coverUrl: previousCoverUrl || null,
    });
    if (!targetPublicationId) {
      setCoverImageUrl(previousCoverUrl);
      isUploadingCover.current = false;
      URL.revokeObjectURL(localPreview);
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    try {
      const { publicUrl } = await uploadStorageImage({
        supabase,
        file,
        category: STORAGE_CATEGORIES.PUBLICATION_COVER,
        userId: user.id,
        publicationId: targetPublicationId,
      });

      uploadedCoverImages.current.push(publicUrl);
      setCoverImageUrl(publicUrl);
    } catch (err: unknown) {
      toast.error(
        getStorageUploadErrorMessage(err, storageDict, routeDict.dashboard.genericUploadError)
      );
      setCoverImageUrl(previousCoverUrl);
    } finally {
      URL.revokeObjectURL(localPreview);
      isUploadingCover.current = false;
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleInlineImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    isUploadingInline.current = true;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(storageDict.sessionRequired);
      isUploadingInline.current = false;
      if (inlineImageRef.current) inlineImageRef.current.value = '';
      return;
    }

    const targetPublicationId = await ensurePublicationId();
    if (!targetPublicationId) {
      isUploadingInline.current = false;
      if (inlineImageRef.current) inlineImageRef.current.value = '';
      return;
    }

    const localUrl = URL.createObjectURL(file);

    const caption = await prompt({
      title: dict.captionPrompt.title,
      description: dict.captionPrompt.description,
      placeholder: dict.captionPrompt.placeholder,
      confirmLabel: dict.insert,
      cancelLabel: routeDict.common.cancel,
    });

    (
      editor.chain().focus() as unknown as {
        setFigure: (options: { src: string; caption?: string }) => { run: () => void };
      }
    )
      .setFigure({
        src: localUrl,
        caption: caption || undefined,
      })
      .run();

    try {
      const { publicUrl } = await uploadStorageImage({
        supabase,
        file,
        category: STORAGE_CATEGORIES.PUBLICATION_INLINE,
        userId: user.id,
        publicationId: targetPublicationId,
        originalFilename: file.name,
      });

      uploadedInlineImages.current.push(publicUrl);

      let replaced = false;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'figure' && node.attrs.src === localUrl) {
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              src: publicUrl,
            })
          );
          replaced = true;
          return false;
        }
        return true;
      });
      if (!replaced) {
        const html = editor.getHTML().replaceAll(localUrl, publicUrl);
        editor.commands.setContent(html);
      }

      const updatedHtml = editor.getHTML();
      setContents((prev) => ({ ...prev, [activeLangRef.current]: updatedHtml }));
    } catch (err: unknown) {
      toast.error(
        getStorageUploadErrorMessage(err, storageDict, routeDict.dashboard.genericUploadError)
      );
      removeFigureBySrc(editor, localUrl);
    } finally {
      URL.revokeObjectURL(localUrl);
      isUploadingInline.current = false;
      if (inlineImageRef.current) inlineImageRef.current.value = '';
    }
  };

  const insertYoutube = async () => {
    if (!editor) return;
    const url = await prompt({
      title: dict.youtubePrompt.title,
      description: dict.youtubePrompt.description,
      placeholder: dict.youtubePrompt.placeholder,
      confirmLabel: dict.insert,
      cancelLabel: routeDict.common.cancel,
      validate: (val) => (!val.trim() ? dict.youtubePrompt.emptyUrl : null),
    });
    if (url?.trim()) {
      editor.commands.setYoutubeVideo({ src: url.trim() });
    }
  };

  const insertMath = async () => {
    if (!editor) return;
    const latex = await prompt({
      title: dict.latexPrompt.title,
      description: dict.latexPrompt.description,
      placeholder: dict.latexPrompt.placeholder,
      multiline: true,
      confirmLabel: dict.insert,
      cancelLabel: routeDict.common.cancel,
      validate: (val) => (!val.trim() ? dict.latexPrompt.emptyFormula : null),
    });
    if (latex?.trim()) {
      (
        editor.chain().focus() as unknown as {
          insertBlockMath: (opts: { latex: string }) => { run: () => boolean };
        }
      )
        .insertBlockMath({ latex: latex.trim() })
        .run();
    }
  };

  const insertTable = () => {
    if (!editor) return;
    (
      editor.chain().focus() as unknown as {
        insertTable: (opts: { rows: number; cols: number; withHeaderRow?: boolean }) => {
          run: () => boolean;
        };
      }
    )
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const handleTranslate = async () => {
    if (!editor) return;
    setIsTranslating(true);

    const targetLangs = i18n.locales.filter((loc) => loc !== activeLang);
    const sourceHtml = editor.getHTML();
    const sourceTitulo = titles[activeLang] || '';
    const sourceSubtitulo = subtitles[activeLang] || '';

    try {
      for (const targetLang of targetLangs) {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: sourceTitulo,
            subtitle: sourceSubtitulo,
            htmlContent: sourceHtml && sourceHtml !== '<p></p>' ? sourceHtml : '',
            targetLanguage: targetLang,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (
            res.status === 429 ||
            data.error?.includes('429') ||
            data.details?.includes('429')
          ) {
            throw new Error(dict.geminiQuotaExceeded);
          }
          throw new Error(data.error || routeDict.dashboard.unknownError);
        }

        if (data.title) {
          setTitles((prev) => ({ ...prev, [targetLang]: data.title }));
        }
        if (data.subtitle) {
          setSubtitles((prev) => ({ ...prev, [targetLang]: data.subtitle }));
        }
        if (data.htmlContent) {
          setContents((prev) => ({ ...prev, [targetLang]: stripIndex(data.htmlContent) }));
        }
      }
      toast.success(dict.translateSuccess);
    } catch (e: unknown) {
      console.error(e);
      toast.error((e instanceof Error ? e.message : String(e)) || dict.translateError);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleClearAll = async () => {
    const ok = await confirm({
      title: dict.clearAllTitle,
      description: dict.clearAllConfirm,
      confirmLabel: dict.clear,
      cancelLabel: routeDict.common.cancel,
      variant: 'danger',
    });

    if (ok) {
      setTitles(createEmptyLocalizedMap());
      setSubtitles(createEmptyLocalizedMap());
      setContents(createEmptyLocalizedMap());
      setCoverImageUrl('');
      setTematicas([]);
      setShowIndex(false);
      if (editor) {
        editor.commands.setContent('');
      }
    }
  };

  const validateForPublishOrReview = (): boolean => {
    const currentHtml = editor?.getHTML() || '';
    const rawByLocale: LocalizedFieldMap = {
      ...contents,
      [activeLang]: currentHtml,
    };

    if (languageMode === 'monolingual') {
      const hasTitle = Boolean(titles[activeLang]?.trim());
      const hasBody = hasMeaningfulHtmlContent(stripIndex(rawByLocale[activeLang] || ''));
      if (!hasTitle || !hasBody) {
        const label = i18n.localeLabels[activeLang] || activeLang.toUpperCase();
        toast.error(dict.validationMissingMonolingual.replace('{language}', label));
        return false;
      }
      return true;
    }

    const missingLocales = i18n.locales.filter(
      (loc) =>
        !titles[loc]?.trim() || !hasMeaningfulHtmlContent(stripIndex(rawByLocale[loc] || ''))
    );
    if (missingLocales.length > 0) {
      const missingLabels = missingLocales
        .map((loc) => i18n.localeLabels[loc] || loc.toUpperCase())
        .join(', ');
      toast.error(dict.validationMissingBilingual.replace('{languages}', missingLabels));
      return false;
    }

    return true;
  };

  const handleOpenPublishModal = () => {
    if (!validateForPublishOrReview()) return;
    setShowPublishModal(true);
  };

  const handleSubmit = async (action: EditorAction = EDITOR_ACTIONS.PUBLISH) => {
    if (isUploadingCover.current || isUploadingInline.current) {
      toast.warning(storageDict.uploadWait);
      return;
    }

    const requiresFullContent =
      action === EDITOR_ACTIONS.PUBLISH ||
      action === EDITOR_ACTIONS.SUBMIT_APPROVAL ||
      action === EDITOR_ACTIONS.APPROVE;
    if (requiresFullContent && !validateForPublishOrReview()) {
      return;
    }

    const currentHtml = editor?.getHTML() || '';
    if (languageMode === 'monolingual') {
      const droppedSavedLocales = initialSavedLocales.filter((loc) => loc !== activeLang);
      if (droppedSavedLocales.length > 0) {
        const droppedLabels = droppedSavedLocales
          .map((loc) => i18n.localeLabels[loc] || loc.toUpperCase())
          .join(', ');
        const keptLabel = i18n.localeLabels[activeLang] || activeLang.toUpperCase();
        const confirmed = await confirm({
          title: dict.downgradeConfirmTitle,
          description: dict.downgradeConfirmDesc.replace('{language}', droppedLabels),
          confirmLabel: dict.downgradeConfirmAction.replace('{language}', keptLabel),
          cancelLabel: routeDict.common.cancel,
          variant: 'danger',
        });
        if (!confirmed) {
          return;
        }
      }
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (isUploadingCover.current || isUploadingInline.current) {
      toast.warning(storageDict.uploadWait);
      return;
    }

    const userId = currentUser?.id || 'general';

    const rawByLocale: LocalizedFieldMap = {
      ...contents,
      [activeLang]: currentHtml,
    };

    const hasBase64 = i18n.locales.some((loc) =>
      (rawByLocale[loc] || '').includes(';base64,')
    );

    if (lazyDraftPromiseRef.current) {
      await lazyDraftPromiseRef.current;
    }

    let activePublicationId = publicationIdRef.current;
    if (hasBase64 && !activePublicationId) {
      const ensured = await ensurePublicationId();
      if (!ensured) {
        return;
      }
      activePublicationId = ensured;
    }

    const sanitizedContents = createEmptyLocalizedMap();
    const localesToPersist: readonly Locale[] =
      languageMode === 'monolingual' ? [activeLang] : i18n.locales;

    for (const loc of localesToPersist) {
      const stripped = stripIndex(rawByLocale[loc] || '');
      sanitizedContents[loc] = await sanitizeBase64Images(
        stripped,
        userId,
        supabase,
        (url) => uploadedInlineImages.current.push(url),
        activePublicationId
      );
    }

    const effectiveOriginalLanguage: Locale =
      languageMode === 'monolingual' ? activeLang : idiomaOriginal;

    const payloadTitle: LocalizedString =
      languageMode === 'monolingual' ? { [activeLang]: titles[activeLang] ?? '' } : { ...titles };
    const payloadSubtitle: LocalizedString =
      languageMode === 'monolingual'
        ? { [activeLang]: subtitles[activeLang] ?? '' }
        : { ...subtitles };
    const payloadContent: LocalizedString =
      languageMode === 'monolingual'
        ? { [activeLang]: sanitizedContents[activeLang] ?? '' }
        : { ...sanitizedContents };

    const pathsToDelete = collectSupersededStoragePaths({
      initialContents: initialRawContents,
      finalContents: sanitizedContents,
      uploadedInlineUrls: uploadedInlineImages.current,
      savedCoverUrl: savedCoverUrlRef.current,
      currentCoverUrl: coverImageUrl,
      uploadedCoverUrls: uploadedCoverImages.current,
    });

    try {
      const saveResult = await onSave(
        {
          ...(activePublicationId ? { id: activePublicationId } : {}),
          title: payloadTitle,
          subtitle: payloadSubtitle,
          content: payloadContent,
          cover_image_url: coverImageUrl,
          tags: tematicas,
          type: tipo,
          original_language: effectiveOriginalLanguage,
          language_mode: languageMode,
          show_index: showIndex,
          published_at: initialData?.published_at,
          titulo_gl: payloadTitle.gl ?? '',
          titulo_es: payloadTitle.es ?? '',
          subtitulo_gl: payloadSubtitle.gl ?? '',
          subtitulo_es: payloadSubtitle.es ?? '',
          contenido_gl: payloadContent.gl ?? '',
          contenido_es: payloadContent.es ?? '',
          imagen_url: coverImageUrl,
          tematicas,
          tipo,
          idioma_original: effectiveOriginalLanguage,
        },
        action
      );

      const isSuccess =
        saveResult === false ||
        (typeof saveResult === 'object' &&
          saveResult !== null &&
          'success' in saveResult &&
          !saveResult.success)
          ? false
          : true;

      if (!isSuccess) {
        return;
      }

      if (pathsToDelete.length > 0) {
        removeStorageImages(supabase, pathsToDelete).catch(console.error);
      }

      savedCoverUrlRef.current = coverImageUrl;
      uploadedCoverImages.current = [];
      uploadedInlineImages.current = [];

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      localStorage.removeItem(draftKey);
      if (activePublicationId) {
        localStorage.removeItem(`cerna_draft_${activePublicationId}`);
      }
      setHasUnsavedChanges(false);
      setShowPublishModal(false);
    } catch (saveError) {
      console.error('Error saving article:', saveError);
    }
  };

  const activeHtml = stripIndex(contents[activeLang] || '');
  const liveTocItems = showIndex ? buildLiveTocItems(tocData, activeHtml) : [];
  const previewArticleDict = getDictionaryClient(activeLang).article;

  return (
    <>
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverFileSelected}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={inlineImageRef}
        onChange={handleInlineImageSelected}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {showPublishModal && (
        <PublishConfirmModal
          routeLang={routeLang}
          mode={mode}
          isPublishing={isPublishing}
          languageMode={languageMode}
          activeLang={activeLang}
          onCancel={() => setShowPublishModal(false)}
          onConfirm={() => handleSubmit(EDITOR_ACTIONS.PUBLISH)}
        />
      )}

      <div className="flex flex-grow relative">
        <div className="flex-grow w-full">
          <EditorToolbar
            editor={editor}
            routeLang={routeLang}
            mode={mode}
            permissions={permissions}
            publicationStatus={initialData?.status || initialData?.estado}
            isPublishing={isPublishing}
            showIndex={showIndex}
            onInsertImage={() => inlineImageRef.current?.click()}
            onInsertYoutube={insertYoutube}
            onInsertMath={insertMath}
            onInsertTable={insertTable}
            onToggleShowIndex={() => setShowIndex((prev) => !prev)}
            onClearAll={handleClearAll}
            onChangeCover={() => coverInputRef.current?.click()}
            onOpenPreview={() => setShowPreview(true)}
            onSubmitAction={handleSubmit}
            onOpenPublishModal={handleOpenPublishModal}
          />

          <div className="max-w-[800px] mx-auto py-8 px-8 editor-container">
            <ArticleMetadataSection
              routeLang={routeLang}
              activeLang={activeLang}
              onSwitchLang={handleSwitchLang}
              languageMode={languageMode}
              onToggleLanguageMode={handleToggleLanguageMode}
              isTranslating={isTranslating}
              onTranslate={handleTranslate}
              tags={tematicas}
              onChangeTags={setTematicas}
              publicationType={tipo}
              onChangeType={setTipo}
              originalLanguage={idiomaOriginal}
              onChangeOriginalLanguage={setIdiomaOriginal}
              title={titles[activeLang] || ''}
              onChangeTitle={(val) =>
                setTitles((prev) => ({ ...prev, [activeLang]: val }))
              }
              subtitle={subtitles[activeLang] || ''}
              onChangeSubtitle={(val) =>
                setSubtitles((prev) => ({ ...prev, [activeLang]: val }))
              }
            />

            <div className="space-y-12 mt-12">
              <div className="h-[1px] w-12 bg-gold opacity-30"></div>

              <div className="space-y-8">
                {showIndex &&
                  (liveTocItems.length > 0 ? (
                    <ArticleTableOfContents
                      items={liveTocItems}
                      label={previewArticleDict.indexLabel}
                      ariaLabel={previewArticleDict.indexAriaLabel}
                      onItemClick={(e, item) => {
                        e.preventDefault();
                        const match = tocData.find((d) => d.id === item.id);
                        if (match?.dom && typeof match.dom.scrollIntoView === 'function') {
                          match.dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        if (typeof match?.pos === 'number') {
                          editor?.commands.focus(match.pos);
                        }
                      }}
                    />
                  ) : (
                    <div className="border-y border-lines/70 bg-surface/50 py-5 px-6 mb-6 text-sm font-sans text-charcoal/60 italic">
                      {dict.noHeadingsFound}
                    </div>
                  ))}
                <EditorContent editor={editor} />
                <TableControls editor={editor} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <ArticlePreviewModal
          routeLang={routeLang}
          activeLang={activeLang}
          title={titles[activeLang] || ''}
          subtitle={subtitles[activeLang] || ''}
          htmlContent={contents[activeLang] || ''}
          coverImageUrl={coverImageUrl}
          tags={tematicas}
          publicationType={tipo}
          showIndex={showIndex}
          authorName={authorProfileRow?.full_name || ''}
          authorAvatarUrl={authorProfileRow?.avatar_url || undefined}
          authorBio={resolveLocalizedText(authorProfileRow?.bio, activeLang)}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
