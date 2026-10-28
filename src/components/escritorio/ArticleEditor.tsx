"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { ARTICLE_STATES } from '@/lib/constants';
import { DEFAULT_COVER_URL, DEFAULT_AVATAR_URL, ARTICLE_TYPES } from '@/lib/constants';
import FormattedDate from '@/components/ui/FormattedDate';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Figure } from '@/lib/editor/FigureExtension';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import 'katex/dist/katex.min.css';
import { MathKit } from '@/lib/editor/MathExtensions';
import { CustomTable, TableRow, CustomTableCell, CustomTableHeader } from '@/lib/editor/TableExtensions';
import TableControls from '@/components/escritorio/TableControls';
import { renderMathInHtml } from '@/lib/editor/renderMath';
import { renderHeadingAnchors } from '@/lib/editor/renderHeadingAnchors';
import { getHeadingsFromHtml, generateIndex, stripIndex } from '@/lib/editor/generateIndex';
import { ArticleIndex } from '@/lib/editor/ArticleIndexExtension';
import { useParams } from 'next/navigation';
import { useToast, useConfirm, usePrompt } from '@/components/ui/FeedbackProvider';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';
import { createClient } from '@/lib/supabase/client';
import TagManager from '@/components/escritorio/TagManager';
import type { LocalizedString } from '@/lib/db/types';
import { DB_TABLES, USER_COLS, USER_ROLES, PUBLICATION_STATUSES, PUBLICATION_TYPES } from '@/lib/db/schema';
import {
  uploadStorageImage,
  removeStorageImages,
  extractInlineStoragePaths,
  extractStoragePathFromUrl,
  STORAGE_CATEGORIES,
} from '@/lib/storage';


const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
};

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

export type EditorAction = typeof PUBLICATION_STATUSES.DRAFT | 'publish' | 'submit_approval' | 'approve' | 'reject' | 'revoke_approval';

export type OnSaveResult = boolean | { success: boolean } | void;

interface ArticleEditorProps {
    initialData?: ArticleData;
    onSave: (data: ArticleData, action: EditorAction) => Promise<OnSaveResult>;
    isPublishing: boolean;
    mode: 'create' | 'edit';
    userRole?: string;
}

export default function ArticleEditor({ mode = 'create', initialData, onSave, isPublishing , userRole = USER_ROLES.READER}: ArticleEditorProps) {
    const params = useParams();
    const routeLang = (params?.lang as string) || 'gl';
    const dict = routeLang === 'gl' ? glDict.articleEditor : esDict.articleEditor;
    const storageDict = routeLang === 'gl' ? glDict.escritorio.storage : esDict.escritorio.storage;
    const toast = useToast();
    const confirm = useConfirm();
    const prompt = usePrompt();
    const docTypes = (routeLang === 'gl' ? glDict.documentTypes : esDict.documentTypes) as Record<string, string>;

    const [showPublishModal, setShowPublishModal] = useState(false);
    
    // Bilingual state
    const [activeLang, setActiveLang] = useState<'gl'|'es'>('gl');
    const [tituloGl, setTituloGl] = useState(initialData?.title?.gl || initialData?.titulo_gl || '');
    const [tituloEs, setTituloEs] = useState(initialData?.title?.es || initialData?.titulo_es || '');
    const [subtituloGl, setSubtituloGl] = useState(initialData?.subtitle?.gl || initialData?.subtitulo_gl || '');
    const [subtituloEs, setSubtituloEs] = useState(initialData?.subtitle?.es || initialData?.subtitulo_es || '');
    const [contenidoGl, setContenidoGl] = useState(initialData?.content?.gl || initialData?.contenido_gl || '');
    const [contenidoEs, setContenidoEs] = useState(initialData?.content?.es || initialData?.contenido_es || '');
    const [isTranslating, setIsTranslating] = useState(false);
    const origLang = initialData?.original_language || initialData?.idioma_original;
    const [idiomaOriginal, setIdiomaOriginal] = useState((origLang && ['es', 'gl'].includes(origLang)) ? origLang : 'gl');
    
    // Fix stale closure for onUpdate
    const activeLangRef = useRef(activeLang);
    useEffect(() => {
        activeLangRef.current = activeLang;
    }, [activeLang]);

    const initialType = initialData?.type || initialData?.tipo;
    const [tipo, setTipo] = useState(initialType || PUBLICATION_TYPES.ARTICLE);
    const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || initialData?.imagen_url || '');
    const [tematicas, setTematicas] = useState<string[]>(initialData?.tags || initialData?.tematicas || []);
    const [showPreview, setShowPreview] = useState(false);
    const isUploadingCover = useRef(false);
    const isUploadingInline = useRef(false);
    const uploadedInlineImages = useRef<string[]>([]);
    const uploadedCoverImages = useRef<string[]>([]);
    const savedCoverUrlRef = useRef<string | null>(initialData?.cover_image_url || initialData?.imagen_url || null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const inlineImageRef = useRef<HTMLInputElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [authorProfile, setAuthorProfile] = useState<{ nombre: string; avatar_url?: string; bio?: string } | null>(null);

    useEffect(() => {
        if (initialData?.cover_image_url || initialData?.imagen_url) {
            savedCoverUrlRef.current = initialData.cover_image_url || initialData.imagen_url || null;
        }
    }, [initialData?.cover_image_url, initialData?.imagen_url]);
    
    const supabase = createClient();

    // Auto-save logic
    const draftKey = `cerna_draft_${initialData?.id || 'new'}`;
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const isInitialized = useRef(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const stateRef = useRef({ tituloGl, tituloEs, subtituloGl, subtituloEs, contenidoGl, contenidoEs, coverImageUrl, tematicas, tipo });

    useEffect(() => {
        stateRef.current = { tituloGl, tituloEs, subtituloGl, subtituloEs, contenidoGl, contenidoEs, coverImageUrl, tematicas, tipo };
    }, [tituloGl, tituloEs, subtituloGl, subtituloEs, contenidoGl, contenidoEs, coverImageUrl, tematicas, tipo]);

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
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from(DB_TABLES.USERS)
                    .select(`${USER_COLS.FULL_NAME}, ${USER_COLS.AVATAR_URL}, ${USER_COLS.BIO}`)
                    .eq(USER_COLS.ID, user.id)
                    .single();
                if (data) {
                    const row = data as { full_name?: string | null; avatar_url?: string | null; bio?: LocalizedString | null };
                    setAuthorProfile({
                        nombre: row.full_name || '',
                        avatar_url: row.avatar_url || undefined,
                        bio: typeof row.bio === 'string' ? row.bio : (row.bio?.gl || row.bio?.es || '')
                    });
                }
            }
        };
        fetchProfile();
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
            ArticleIndex,
        ],
        content: initialData?.content?.gl || initialData?.contenido_gl || (mode === 'create' ? '<p>La naturaleza del pensamiento contemporáneo exige una pausa deliberada...</p>' : ''),
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'w-full border-none bg-transparent font-sans text-xl text-charcoal focus:outline-none min-h-[400px] outline-none article-content',
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (activeLangRef.current === 'gl') {
                setContenidoGl(html);
            } else {
                setContenidoEs(html);
            }

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                const state = stateRef.current;
                const draft = {
                    tituloGl: state.tituloGl,
                    tituloEs: state.tituloEs,
                    subtituloGl: state.subtituloGl,
                    subtituloEs: state.subtituloEs,
                    contenidoGl: activeLangRef.current === 'gl' ? html : state.contenidoGl,
                    contenidoEs: activeLangRef.current === 'es' ? html : state.contenidoEs,
                    imagen_url: state.coverImageUrl,
                    tematicas: state.tematicas,
                    tipo: state.tipo
                };
                localStorage.setItem(draftKey, JSON.stringify(draft));
                setHasUnsavedChanges(true);
            }, 1500);
        }
    });

    useEffect(() => {
        if (!editor || !isInitialized.current) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            const state = stateRef.current;
            const draft = {
                tituloGl: state.tituloGl,
                tituloEs: state.tituloEs,
                subtituloGl: state.subtituloGl,
                subtituloEs: state.subtituloEs,
                contenidoGl: state.contenidoGl,
                contenidoEs: state.contenidoEs,
                imagen_url: state.coverImageUrl,
                tematicas: state.tematicas,
                tipo: state.tipo
            };
            localStorage.setItem(draftKey, JSON.stringify(draft));
            setHasUnsavedChanges(true);
        }, 1500);
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, [tituloGl, tituloEs, subtituloGl, subtituloEs, contenidoGl, contenidoEs, coverImageUrl, tematicas, tipo, draftKey, editor]);

    useEffect(() => {
        if (editor && !isInitialized.current) {
            isInitialized.current = true;
            
            if (typeof window !== 'undefined') {
                const savedDraft = localStorage.getItem(draftKey);
                if (savedDraft) {
                    try {
                        const parsed = JSON.parse(savedDraft);
                        setTimeout(() => {
                            if (parsed.tituloGl) setTituloGl(parsed.tituloGl);
                            if (parsed.tituloEs) setTituloEs(parsed.tituloEs);
                            if (parsed.subtituloGl) setSubtituloGl(parsed.subtituloGl);
                            if (parsed.subtituloEs) setSubtituloEs(parsed.subtituloEs);
                            if (parsed.tipo && ARTICLE_TYPES.includes(parsed.tipo)) setTipo(parsed.tipo);
                            if (parsed.imagen_url) setCoverImageUrl(parsed.imagen_url);
                            if (parsed.tematicas) setTematicas(parsed.tematicas);
                            if (parsed.contenidoGl) {
                                setContenidoGl(parsed.contenidoGl);
                                if (activeLang === 'gl') editor.commands.setContent(parsed.contenidoGl);
                            }
                            if (parsed.contenidoEs) {
                                setContenidoEs(parsed.contenidoEs);
                                if (activeLang === 'es') editor.commands.setContent(parsed.contenidoEs);
                            }
                            setHasUnsavedChanges(true);
                        }, 0);
                        return;
                    } catch (e) {
                        console.error('Error parseando borrador', e);
                    }
                }
            }
            
            const savedContentGl = initialData?.content?.gl || initialData?.contenido_gl;
            if (savedContentGl) {
                editor.commands.setContent(savedContentGl);
            }
        }
    }, [editor, draftKey, activeLang, initialData?.content?.gl, initialData?.contenido_gl]);

    const handleChangeCoverImage = () => {
        coverInputRef.current?.click();
    };

    const handleCoverFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        isUploadingCover.current = true;
        const localPreview = URL.createObjectURL(file);
        setCoverImageUrl(localPreview);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error(storageDict.sessionRequired);
            isUploadingCover.current = false;
            URL.revokeObjectURL(localPreview);
            return;
        }

        try {
            const { publicUrl } = await uploadStorageImage({
                supabase,
                file,
                category: STORAGE_CATEGORIES.PUBLICATION_COVER,
                userId: user.id,
            });

            uploadedCoverImages.current.push(publicUrl);
            setCoverImageUrl(publicUrl);
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : '';
            if (errorMsg === 'INVALID_FORMAT') {
                toast.error(storageDict.invalidFormat);
            } else if (errorMsg.startsWith('FILE_TOO_LARGE:')) {
                const maxMb = errorMsg.split(':')[1] || '8';
                toast.error(storageDict.fileTooLarge.replace('{max}', maxMb));
            } else {
                toast.error(storageDict.uploadError.replace('{error}', errorMsg || 'Error'));
            }
            setCoverImageUrl(initialData?.cover_image_url || '');
        } finally {
            URL.revokeObjectURL(localPreview);
            isUploadingCover.current = false;
            if (coverInputRef.current) coverInputRef.current.value = '';
        }
    };

    const insertImage = () => {
        inlineImageRef.current?.click();
    };

    const handleInlineImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        isUploadingInline.current = true;
        const localUrl = URL.createObjectURL(file);

        const caption = await prompt({
            title: dict.captionPrompt.title,
            description: dict.captionPrompt.description,
            placeholder: dict.captionPrompt.placeholder,
            confirmLabel: dict.insert,
            cancelLabel: routeLang === 'gl' ? glDict.common.cancel : esDict.common.cancel,
        });

        (editor.chain().focus() as unknown as { setFigure: (options: { src: string; caption?: string }) => { run: () => void } }).setFigure({
            src: localUrl,
            caption: caption || undefined,
        }).run();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error(storageDict.sessionRequired);
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'figure' && node.attrs.src === localUrl) {
                    editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize));
                }
            });
            URL.revokeObjectURL(localUrl);
            isUploadingInline.current = false;
            return;
        }

        try {
            const { publicUrl } = await uploadStorageImage({
                supabase,
                file,
                category: STORAGE_CATEGORIES.PUBLICATION_INLINE,
                userId: user.id,
                originalFilename: file.name,
            });

            uploadedInlineImages.current.push(publicUrl);

            let replaced = false;
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'figure' && node.attrs.src === localUrl) {
                    editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, {
                        ...node.attrs,
                        src: publicUrl,
                    }));
                    replaced = true;
                }
            });
            if (!replaced) {
                const html = editor.getHTML().replaceAll(localUrl, publicUrl);
                editor.commands.setContent(html);
            }
            const updatedHtml = editor.getHTML();
            if (activeLangRef.current === 'gl') {
                setContenidoGl(updatedHtml);
            } else {
                setContenidoEs(updatedHtml);
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : '';
            if (errorMsg === 'INVALID_FORMAT') {
                toast.error(storageDict.invalidFormat);
            } else if (errorMsg.startsWith('FILE_TOO_LARGE:')) {
                const maxMb = errorMsg.split(':')[1] || '8';
                toast.error(storageDict.fileTooLarge.replace('{max}', maxMb));
            } else {
                toast.error(storageDict.uploadError.replace('{error}', errorMsg || 'Error'));
            }
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'figure' && node.attrs.src === localUrl) {
                    editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize));
                }
            });
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
            cancelLabel: routeLang === 'gl' ? glDict.common.cancel : esDict.common.cancel,
            validate: (val) => {
                if (!val.trim()) return dict.youtubePrompt.emptyUrl;
                return null;
            },
        });
        if (url && url.trim() && editor) {
            editor.commands.setYoutubeVideo({
                src: url.trim(),
            });
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
            cancelLabel: routeLang === 'gl' ? glDict.common.cancel : esDict.common.cancel,
            validate: (val) => {
                if (!val.trim()) return dict.latexPrompt.emptyFormula;
                return null;
            },
        });
        if (latex && latex.trim()) {
            (editor.chain().focus() as unknown as { insertBlockMath: (opts: { latex: string }) => { run: () => boolean } }).insertBlockMath({ latex: latex.trim() }).run();
        }
    };

    const insertTable = () => {
        if (!editor) return;
        (editor.chain().focus() as unknown as { insertTable: (opts: { rows: number; cols: number; withHeaderRow?: boolean }) => { run: () => boolean } }).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const handleInsertIndex = () => {
        if (!editor) return;
        const rawHtml = editor.getHTML();
        const items = getHeadingsFromHtml(rawHtml);
        if (!items.length) {
            toast.warning(dict.noHeadingsFound);
            return;
        }

        const editorWithIndex = editor as unknown as { commands?: { insertArticleIndex?: (args: { items: typeof items; lang: string }) => boolean } } | null;
        if (typeof editorWithIndex?.commands?.insertArticleIndex === 'function') {
            editorWithIndex.commands.insertArticleIndex({ items, lang: activeLang });
        } else if (editor.state?.schema?.nodes?.articleIndex) {
            const { state, view } = editor;
            let existingPos: number | null = null;
            let existingSize = 0;
            state.doc.descendants((node, pos) => {
                if (node.type.name === 'articleIndex') {
                    existingPos = pos;
                    existingSize = node.nodeSize;
                    return false;
                }
            });

            const indexNode = state.schema.nodes.articleIndex.create({ items, lang: activeLang });
            const tr = state.tr;
            if (existingPos !== null) {
                tr.replaceWith(existingPos, existingPos + existingSize, indexNode);
            } else {
                tr.insert(0, indexNode);
            }
            view.dispatch(tr);
        } else {
            const stripped = stripIndex(rawHtml);
            const indexHtml = generateIndex(stripped, activeLang);
            editor.commands.setContent(indexHtml + '\n' + stripped);
        }
    };

    const handleTranslate = async () => {
        if (!editor) return;
        setIsTranslating(true);
        
        const targetLang = activeLang === 'gl' ? 'es' : 'gl';
        const sourceHtml = editor.getHTML();
        const sourceTitulo = activeLang === 'gl' ? tituloGl : tituloEs;
        const sourceSubtitulo = activeLang === 'gl' ? subtituloGl : subtituloEs;
        
        try {
            const payload = {
                title: sourceTitulo,
                subtitle: sourceSubtitulo,
                htmlContent: sourceHtml && sourceHtml !== '<p></p>' ? sourceHtml : '',
                targetLanguage: targetLang
            };

            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429 || data.error?.includes('429') || data.details?.includes('429')) {
                    throw new Error('Has superado el límite gratuito de peticiones de Gemini (15 por minuto). Por favor, espera un minuto antes de volver a traducir.');
                }
                throw new Error(data.error || 'Error desconocido del servidor');
            }

            if (data.title) {
                if (targetLang === 'gl') setTituloGl(data.title); else setTituloEs(data.title);
            }
            if (data.subtitle) {
                if (targetLang === 'gl') setSubtituloGl(data.subtitle); else setSubtituloEs(data.subtitle);
            }
            if (data.htmlContent) {
                if (targetLang === 'gl') setContenidoGl(data.htmlContent); else setContenidoEs(data.htmlContent);
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
            cancelLabel: routeLang === 'gl' ? glDict.common.cancel : esDict.common.cancel,
            variant: 'danger',
        });

        if (ok) {
            setTituloGl('');
            setTituloEs('');
            setSubtituloGl('');
            setSubtituloEs('');
            setContenidoGl('');
            setContenidoEs('');
            setCoverImageUrl('');
            setTematicas([]);
            if (editor) {
                editor.commands.setContent('');
            }
        }
    };

    const sanitizeBase64Images = async (html: string, userId: string): Promise<string> => {
        if (!html || !html.includes(';base64,')) return html;
        const base64Regex = /data:image\/([a-zA-Z0-9]+);base64,([A-Za-z0-9+/=]+)/g;
        const matches: { fullMatch: string; format: string; base64Data: string }[] = [];
        let match;
        while ((match = base64Regex.exec(html)) !== null) {
            matches.push({ fullMatch: match[0], format: match[1], base64Data: match[2] });
        }
        let cleaned = html;
        for (let i = 0; i < matches.length; i++) {
            const m = matches[i];
            try {
                const byteCharacters = atob(m.base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let j = 0; j < byteCharacters.length; j++) {
                    byteNumbers[j] = byteCharacters.charCodeAt(j);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: `image/${m.format === 'jpg' ? 'jpeg' : m.format}` });
                const { publicUrl } = await uploadStorageImage({
                    supabase,
                    file: blob,
                    category: STORAGE_CATEGORIES.PUBLICATION_INLINE,
                    userId,
                    originalFilename: `pasted-${i}`,
                });
                cleaned = cleaned.replace(m.fullMatch, publicUrl);
                uploadedInlineImages.current.push(publicUrl);
            } catch (err) {
                console.error('Error uploading pasted base64 image:', err);
            }
        }
        return cleaned;
    };

    const handleSubmit = async (action: EditorAction = 'publish') => {
        if (isUploadingCover.current || isUploadingInline.current) {
            toast.warning(storageDict.uploadWait);
            return;
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const userId = currentUser?.id || 'general';

        const currentHtml = editor?.getHTML() || '';
        let finalGl = activeLang === 'gl' ? currentHtml : contenidoGl;
        let finalEs = activeLang === 'es' ? currentHtml : contenidoEs;

        finalGl = await sanitizeBase64Images(finalGl, userId);
        finalEs = await sanitizeBase64Images(finalEs, userId);
        
        // --- LIMPIEZA DE IMÁGENES (GARBAGE COLLECTION) ---
        // 1. Inline images
        const oldInlinePaths = [
            ...extractInlineStoragePaths(initialData?.content?.gl || initialData?.contenido_gl),
            ...extractInlineStoragePaths(initialData?.content?.es || initialData?.contenido_es)
        ];
        const newInlinePaths = new Set([
            ...extractInlineStoragePaths(finalGl),
            ...extractInlineStoragePaths(finalEs)
        ]);
        const uploadedInlinePaths = uploadedInlineImages.current
            .map(url => extractStoragePathFromUrl(url))
            .filter((p): p is string => Boolean(p));

        const inlinePathsToDelete = [
            ...oldInlinePaths.filter(p => !newInlinePaths.has(p)),
            ...uploadedInlinePaths.filter(p => !newInlinePaths.has(p))
        ];

        // 2. Cover image: compare saved cover URL with the new cover
        const savedCoverPath = extractStoragePathFromUrl(savedCoverUrlRef.current);
        const newCoverPath = extractStoragePathFromUrl(coverImageUrl);
        const uploadedCoverPaths = uploadedCoverImages.current
            .map(url => extractStoragePathFromUrl(url))
            .filter((p): p is string => Boolean(p));

        const coverPathsToDelete = [
            ...(savedCoverPath && savedCoverPath !== newCoverPath ? [savedCoverPath] : []),
            ...uploadedCoverPaths.filter(p => p !== newCoverPath)
        ];

        const pathsToDelete = Array.from(new Set([
            ...inlinePathsToDelete,
            ...coverPathsToDelete,
        ]));
        // -------------------------------------------------

        try {
            const saveResult = await onSave({
                title: { gl: tituloGl, es: tituloEs },
                subtitle: { gl: subtituloGl, es: subtituloEs },
                content: { gl: finalGl, es: finalEs },
                cover_image_url: coverImageUrl,
                tags: tematicas,
                type: tipo,
                original_language: idiomaOriginal,
                titulo_gl: tituloGl,
                titulo_es: tituloEs,
                subtitulo_gl: subtituloGl,
                subtitulo_es: subtituloEs,
                contenido_gl: finalGl,
                contenido_es: finalEs,
                imagen_url: coverImageUrl,
                tematicas: tematicas,
                tipo: tipo,
                idioma_original: idiomaOriginal
            }, action);

            const isSuccess =
                saveResult === false ||
                (typeof saveResult === 'object' && saveResult !== null && 'success' in saveResult && !saveResult.success)
                    ? false
                    : true;

            if (!isSuccess) {
                return;
            }

            // Only remove superseded images after save succeeds
            if (pathsToDelete.length > 0) {
                removeStorageImages(supabase, pathsToDelete).catch(console.error);
            }

            savedCoverUrlRef.current = coverImageUrl;
            uploadedCoverImages.current = [];
            uploadedInlineImages.current = [];

            localStorage.removeItem(draftKey);
            setHasUnsavedChanges(false);
            setShowPublishModal(false);
        } catch (saveError) {
            console.error('Error saving article:', saveError);
        }
    };

    
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm">
                    <div className="bg-surface p-8 max-w-md w-full border border-lines shadow-2xl">
                        <h2 className="font-serif text-2xl text-charcoal mb-4">
                            {mode === 'create' ? dict.publishModalTitleCreate : dict.publishModalTitleEdit}
                        </h2>
                        <p className="font-sans text-sm text-charcoal/70 mb-8">
                            {mode === 'create' ? dict.publishModalDescCreate : dict.publishModalDescEdit}
                        </p>
                        <div className="flex justify-end gap-4">
                            <button type="button" className="px-6 py-2 font-sans text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors cursor-pointer" onClick={() => setShowPublishModal(false)}>
                                Cancelar
                            </button>
                            <button type="button" className="px-6 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit('publish')}>
                                {isPublishing ? (mode === 'create' ? dict.publishing : dict.saving) : dict.publish}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex flex-grow overflow-hidden relative">
                <div className="flex-grow overflow-y-auto">
                    {/* Floating Toolbar */}
                    <div className="sticky top-0 z-30 border-b border-lines bg-parchment/80 backdrop-blur-sm px-4 md:px-8 py-3 flex flex-col xl:flex-row items-center justify-between gap-3 xl:gap-0">
                        <div className="flex items-center gap-1 text-charcoal/80 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 scrollbar-none">
                            {/* Back to author's articles button */}
                            <Link
                                href={`/${routeLang}/escritorio`}
                                className="flex items-center gap-1.5 h-10 px-3 mr-1 text-charcoal/70 hover:text-charcoal hover:bg-lines/40 border border-lines transition-colors text-xs font-sans uppercase tracking-wider shrink-0 cursor-pointer"
                                title={dict.backToArticles || 'Volver a publicacións'}
                                aria-label={dict.backToArticles || 'Volver a publicacións'}
                            >
                                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                <span className="hidden sm:inline font-semibold">{dict.backToArticles || 'Artigos'}</span>
                            </Link>
                            <div className="h-6 w-[1px] shrink-0 bg-lines mx-1 mr-2"></div>

                            <button type="button" aria-label="Negrita" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('bold') ? 'bg-lines/30' : ''}`} title="Negrita" onClick={() => editor?.chain().focus().toggleBold().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_bold</span></button>
                            <button type="button" aria-label="Cursiva" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('italic') ? 'bg-lines/30' : ''}`} title="Cursiva" onClick={() => editor?.chain().focus().toggleItalic().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_italic</span></button>
                            <select
                                aria-label="Tamaño do texto / Tamaño de texto"
                                className={`h-9 shrink-0 bg-transparent text-xs border px-2 focus:outline-none cursor-pointer transition-colors mx-1 ${
                                    (['9pt', '10pt', '11pt', '12pt', '16pt', '18pt', '20pt', '24pt', '28pt', '32pt', '36pt'].find((size) => editor?.isActive('textStyle', { fontSize: size })) || 'default') === 'default'
                                        ? 'border-gold text-gold font-semibold'
                                        : 'border-lines text-charcoal/80 focus:border-gold'
                                }`}
                                value={
                                    ['9pt', '10pt', '11pt', '12pt', '16pt', '18pt', '20pt', '24pt', '28pt', '32pt', '36pt'].find((size) => editor?.isActive('textStyle', { fontSize: size })) || 'default'
                                }
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const chain = editor?.chain().focus() as unknown as { unsetFontSize: () => { run: () => boolean }; setFontSize: (size: string) => { run: () => boolean } } | undefined;
                                    if (val === 'default') {
                                        chain?.unsetFontSize().run();
                                    } else {
                                        chain?.setFontSize(val).run();
                                    }
                                }}
                                title="Tamaño do texto / Tamaño de texto"
                            >
                                <option value="9pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>9 pt</option>
                                <option value="10pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>10 pt</option>
                                <option value="11pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>11 pt</option>
                                <option value="12pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>12 pt</option>
                                <option value="default" style={{ backgroundColor: 'rgba(212, 175, 55, 0.25)', color: '#b8860b', fontWeight: 'bold' }}>14 pt</option>
                                <option value="16pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>16 pt</option>
                                <option value="18pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>18 pt</option>
                                <option value="20pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>20 pt</option>
                                <option value="24pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>24 pt</option>
                                <option value="28pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>28 pt</option>
                                <option value="32pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>32 pt</option>
                                <option value="36pt" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>36 pt</option>
                            </select>
                            <div className="h-6 w-[1px] shrink-0 bg-lines mx-2"></div>
                            <button type="button" aria-label="Título 1" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer font-serif font-bold ${editor?.isActive('heading', { level: 1 }) ? 'bg-lines/30' : ''}`} title="Título 1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
                            <button type="button" aria-label="Título 2" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer font-serif font-bold ${editor?.isActive('heading', { level: 2 }) ? 'bg-lines/30' : ''}`} title="Título 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
                            <button type="button" aria-label="Título 3" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer font-serif font-bold ${editor?.isActive('heading', { level: 3 }) ? 'bg-lines/30' : ''}`} title="Título 3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
                            <div className="h-6 w-[1px] shrink-0 bg-lines mx-2"></div>
                            <button type="button" aria-label="Cita" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('blockquote') ? 'bg-lines/30' : ''}`} title="Cita" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_quote</span></button>
                            <button type="button" aria-label="Insertar Imagen" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Imagen" onClick={insertImage}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>image</span></button>
                            <button type="button" aria-label="Insertar Vídeo" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Vídeo de YouTube" onClick={insertYoutube}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>smart_display</span></button>
                            <button type="button" aria-label="Lista con viñetas" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('bulletList') ? 'bg-lines/30' : ''}`} title="Lista" onClick={() => editor?.chain().focus().toggleBulletList().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_list_bulleted</span></button>
                            <button type="button" aria-label="Justificar Texto" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-lines/30' : ''}`} title="Justificar" onClick={() => { if (editor?.isActive({ textAlign: 'justify' })) { editor?.chain().focus().unsetTextAlign().run(); } else { editor?.chain().focus().setTextAlign('justify').run(); } }}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_align_justify</span></button>
                            <div className="h-6 w-[1px] shrink-0 bg-lines mx-1"></div>
                            <button type="button" aria-label="Fórmula Matemática" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Fórmula Matemática (LaTeX)" onClick={insertMath}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>functions</span></button>
                            <button type="button" aria-label="Insertar Táboa" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('table') ? 'bg-lines/30' : ''}`} title="Táboa / Tabla" onClick={insertTable}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>table_chart</span></button>
                            <button type="button" aria-label="Insertar / Actualizar Índice" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Insertar / Actualizar Índice" onClick={handleInsertIndex}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_list_numbered</span></button>
                            <div className="h-6 w-[1px] shrink-0 bg-lines mx-2"></div>
                            <button type="button" aria-label="Limpiar todo" className="w-10 h-10 shrink-0 flex items-center justify-center text-charcoal hover:bg-lines/30 transition-colors cursor-pointer" title="Limpiar Todo" onClick={handleClearAll}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>delete_sweep</span></button>
                            <button type="button" aria-label="Cambiar Imagen de Portada" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Portada" onClick={handleChangeCoverImage}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>add_a_photo</span></button>
                            <button type="button" aria-label="Vista Previa" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Vista Previa" onClick={() => setShowPreview(true)}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>visibility</span></button>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 scrollbar-none">
                            <span className="text-[10px] font-sans uppercase tracking-widest text-charcoal/50 italic hidden xl:block shrink-0"></span>
                            {(() => {
                                const isDirectPublisher = userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.FOUNDER || userRole === 'escritor';
                                const isPending = initialData?.status === PUBLICATION_STATUSES.IN_REVIEW || initialData?.estado === ARTICLE_STATES.PENDING;
                                const isPublished = initialData?.status === PUBLICATION_STATUSES.PUBLISHED || initialData?.estado === ARTICLE_STATES.PUBLISHED;
                                const canApprove = isDirectPublisher;
                                const isReviewRole = !isDirectPublisher;

                                if (isPending && canApprove && mode === 'edit') {
                                    return (
                                        <>
                                            <button type="button" className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit('reject')}>
                                                <span className="hidden sm:inline">{dict.reject || 'Rechazar'}</span>
                                                <span className="sm:hidden">{dict.reject || 'Rechazar'}</span>
                                            </button>
                                            <button type="button" className="px-3 md:px-4 py-2 shrink-0 bg-gold text-parchment text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal transition-all cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit('approve')}>
                                                {dict.approveAndPublish || 'Aprobar y Publicar'}
                                            </button>
                                        </>
                                    );
                                }

                                if (isPending && isReviewRole && mode === 'edit') {
                                    return (
                                        <button type="button" className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit('revoke_approval')}>
                                            <span className="hidden sm:inline">{dict.revokeApproval || 'Volver a Borrador'}</span>
                                            <span className="sm:hidden">{dict.revokeApproval || 'Borrador'}</span>
                                        </button>
                                    );
                                }

                                return (
                                    <>
                                        {mode === 'edit' && isPublished ? (
                                            <button type="button" className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit(PUBLICATION_STATUSES.DRAFT)}>
                                                <span className="hidden sm:inline">{dict.unpublish || 'Despublicar'}</span>
                                                <span className="sm:hidden">{dict.unpublish || 'Despublicar'}</span>
                                            </button>
                                        ) : (
                                            <button type="button" className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit(PUBLICATION_STATUSES.DRAFT)}>
                                                <span className="hidden sm:inline">{dict.saveDraft || 'Guardar Borrador'}</span>
                                                <span className="sm:hidden">{dict.saveDraft ? dict.saveDraft.replace('Guardar ', '') : 'Borrador'}</span>
                                            </button>
                                        )}
                                        <button type="button" className="px-3 md:px-4 py-2 shrink-0 bg-charcoal text-parchment text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-gold transition-all cursor-pointer" onClick={() => {
                                            if (isReviewRole) {
                                                handleSubmit('submit_approval');
                                            } else {
                                                setShowPublishModal(true); // For normal publish
                                            }
                                        }}>
                                            {isReviewRole ? (dict.sendForApproval || 'Enviar para Aprobación') : 'Publicar'}
                                        </button>
                                    </>
                                );
                            })()}
</div>
                    </div>

                    {/* Editor Area */}
                    <div className="max-w-[800px] mx-auto py-8 px-8 editor-container">
                        <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-lines">
                            <div className="flex gap-4">
                                <button type="button"                                     onClick={() => { 
                                        setActiveLang('gl'); 
                                        setTimeout(() => editor?.commands.setContent(contenidoGl), 0);
                                    }}
                                    className={`font-sans text-xs uppercase tracking-widest font-bold pb-1 border-b-2 transition-colors ${activeLang === 'gl' ? 'border-charcoal text-charcoal' : 'border-transparent text-charcoal/40 hover:text-charcoal/70'}`}
                                >
                                    Galego
                                </button>
                                <button type="button"                                     onClick={() => { 
                                        setActiveLang('es'); 
                                        setTimeout(() => editor?.commands.setContent(contenidoEs), 0);
                                    }}
                                    className={`font-sans text-xs uppercase tracking-widest font-bold pb-1 border-b-2 transition-colors ${activeLang === 'es' ? 'border-charcoal text-charcoal' : 'border-transparent text-charcoal/40 hover:text-charcoal/70'}`}
                                >
                                    Castellano
                                </button>
                            </div>
                            <button type="button"                                 onClick={handleTranslate}
                                disabled={isTranslating}
                                className="flex items-center gap-2 px-3 py-1.5 border border-gold/50 text-gold hover:bg-gold hover:text-parchment text-[10px] font-sans uppercase tracking-widest transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px]" style={{ fontFamily: 'Material Symbols Outlined' }}>translate</span>
                                {isTranslating ? dict.translating : `${dict.translateTo}${activeLang === 'gl' ? dict.spanish : dict.galician}`}
                            </button>
                        </div>
                        
                        <div className="space-y-12">
                            {/* Category & Title */}
                            <div className="space-y-6 flex flex-col">
                                <div>
                                    <TagManager selectedTags={tematicas} onChange={setTematicas} />
                                </div>
                                <div className="mb-4 flex flex-wrap gap-4">
                                    <select 
                                        aria-label={dict.articleType}
                                        className="bg-transparent text-gold uppercase text-xs tracking-widest font-bold border border-lines p-2 focus:outline-none focus:border-gold cursor-pointer"
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        style={{ colorScheme: 'light dark' }}
                                    >
                                        {ARTICLE_TYPES.map((type) => {
                                            const label = docTypes[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
                                            return (
                                                <option 
                                                    key={type} 
                                                    value={type} 
                                                    style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}
                                                >
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    <select 
                                        aria-label={dict.originalLang}
                                        className="bg-transparent text-gold uppercase text-xs tracking-widest font-bold border border-lines p-2 focus:outline-none focus:border-gold cursor-pointer"
                                        value={idiomaOriginal}
                                        onChange={(e) => setIdiomaOriginal(e.target.value)}
                                        style={{ colorScheme: 'light dark' }}
                                    >
                                        <option value="gl" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>{dict.originalGl}</option>
                                        <option value="es" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>{dict.originalEs}</option>
                                    </select>
                                </div>
                                <textarea 
                                    className="w-full border-none bg-transparent font-serif text-4xl text-charcoal focus:ring-0 placeholder:text-charcoal/30 resize-none overflow-hidden outline-none" 
                                    onInput={(e) => { 
                                        handleInput(e); 
                                        if (activeLang === 'gl') setTituloGl((e.target as HTMLTextAreaElement).value);
                                        else setTituloEs((e.target as HTMLTextAreaElement).value);
                                    }} 
                                    placeholder={activeLang === 'gl' ? dict.titlePlaceholderGl : dict.titlePlaceholderEs} 
                                    value={activeLang === 'gl' ? tituloGl : tituloEs} 
                                    rows={1}
                                />
                                <textarea 
                                    className="w-full border-none bg-transparent font-serif text-xl text-charcoal/60 italic focus:ring-0 placeholder:text-charcoal/30 resize-none overflow-hidden outline-none" 
                                    onInput={(e) => { 
                                        handleInput(e); 
                                        if (activeLang === 'gl') setSubtituloGl((e.target as HTMLTextAreaElement).value);
                                        else setSubtituloEs((e.target as HTMLTextAreaElement).value);
                                    }} 
                                    placeholder={activeLang === 'gl' ? dict.subtitlePlaceholderGl : dict.subtitlePlaceholderEs} 
                                    value={activeLang === 'gl' ? subtituloGl : subtituloEs} 
                                    rows={1}
                                />
                            </div>
                            <div className="h-[1px] w-12 bg-gold opacity-30"></div>
                            {/* Body Content */}
                            <div className="space-y-8">
                                <EditorContent editor={editor} />
                                <TableControls editor={editor} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Preview Modal */}
            {showPreview && (
                <div 
                    ref={previewContainerRef}
                    className="fixed inset-0 z-[150] overflow-y-auto bg-parchment animate-in fade-in duration-200"
                    onClick={(e) => {
                        const target = (e.target as HTMLElement).closest('a');
                        if (target && target.hash && target.hash.startsWith('#')) {
                            e.preventDefault();
                            try {
                                const id = decodeURIComponent(target.hash.slice(1));
                                const container = previewContainerRef.current;
                                if (!container) return;
                                const stripped = id.replace(/^\d+(?:-\d+)*-/, '');
                                let element = container.querySelector(`[id="${CSS.escape(id)}"]`) as HTMLElement;
                                if (!element && stripped && stripped !== id) {
                                    element = container.querySelector(`[id="${CSS.escape(stripped)}"]`) as HTMLElement;
                                }
                                if (!element) {
                                    const targets = container.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], span[id]');
                                    for (let i = 0; i < targets.length; i++) {
                                        const t = targets[i];
                                        const tId = t.id;
                                        if (tId === id || tId === stripped || tId.replace(/^\d+(?:-\d+)*-/, '') === stripped || tId.endsWith(`-${stripped}`) || tId.endsWith(`-${id}`)) {
                                            element = t;
                                            break;
                                        }
                                    }
                                }
                                if (element) {
                                    const elementRect = element.getBoundingClientRect();
                                    const containerRect = container.getBoundingClientRect();
                                    // Sticky topbar is ~68px, plus generous 42px breathing room so screen stops before the title
                                    const headerOffset = 110;
                                    const targetScrollTop = container.scrollTop + (elementRect.top - containerRect.top) - headerOffset;
                                    container.scrollTo({
                                        top: Math.max(0, targetScrollTop),
                                        behavior: 'smooth'
                                    });
                                }
                            } catch {
                                // Fallback
                            }
                        }
                    }}
                >
                    {/* Preview TopBar */}
                    <div className="sticky top-0 z-[160] border-b border-lines bg-parchment/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-sm">
                        {/* Botón a la izquierda para retornar al panel de edición */}
                        <div className="flex items-center">
                            <button
                                type="button"
                                className="group flex items-center gap-2 px-4 py-2 border border-lines bg-surface hover:bg-lines/50 text-charcoal font-sans text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
                                onClick={() => setShowPreview(false)}
                                title={dict.backToEditor || 'Volver ao Editor'}
                                aria-label={dict.backToEditor || 'Volver ao Editor'}
                            >
                                <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:-translate-x-1" style={{ fontFamily: 'Material Symbols Outlined' }}>arrow_back</span>
                                <span className="font-semibold">{dict.backToEditor || 'Volver ao Editor'}</span>
                            </button>
                        </div>

                        {/* Banner arriba a la derecha aclarando que es una preview del artículo */}
                        <div className="flex items-center">
                            <div className="flex items-center px-4 py-2 border border-gold/40 bg-gold/10 text-gold font-sans text-xs uppercase tracking-wider shadow-xs select-none">
                                <span className="font-semibold">
                                    {dict.previewHeader || 'Vista Previa de Publicación'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Preview Content Simulating Article View */}
                    <div className="w-full pb-24">
                        <header className="w-full max-w-3xl px-5 md:px-0 pt-20 pb-12 mx-auto text-center">
                            {(() => {
                                const previewDocTypes = (activeLang === 'es' ? esDict.documentTypes : glDict.documentTypes) as Record<string, string>;
                                const rawType = (tipo || 'artigo').toLowerCase();
                                const typeLabel = previewDocTypes[rawType] || (rawType === 'news' ? (activeLang === 'gl' ? 'Nova' : 'Noticia') : (tipo || 'Artigo'));
                                return (
                                    <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">
                                        {typeLabel}
                                    </span>
                                );
                            })()}
                            <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-6 max-w-4xl mx-auto leading-tight">
                                {activeLang === 'gl' ? (tituloGl || 'Sin título') : (tituloEs || 'Sin título')}
                            </h1>
                            {(subtituloGl || subtituloEs) && (
                                <p className="font-serif text-xl md:text-2xl text-charcoal/60 italic max-w-3xl mx-auto mb-6">
                                    {activeLang === 'gl' ? subtituloGl : subtituloEs}
                                </p>
                            )}
                            {tematicas.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-3 mt-6">
                                    {tematicas.map((t: string) => (
                                         <span key={t} className="px-4 py-1.5 border border-lines text-charcoal text-[10px] uppercase tracking-[0.2em]">{t}</span>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center justify-center gap-4 text-sm font-semibold text-charcoal/70 mt-10">
                                <span className="text-charcoal border-b border-lines pb-1 uppercase tracking-widest">
                                    {authorProfile?.nombre || 'Autor del Artículo'}
                                </span>
                                <span className="font-serif text-lines">—</span>
                                <FormattedDate
                                    date={new Date()}
                                    lang={activeLang}
                                    format="long"
                                    className="uppercase tracking-widest"
                                />
                            </div>
                        </header>

                        {coverImageUrl && (
                            <div className="w-full max-w-6xl px-5 mx-auto mb-16">
                                <NextImage className="w-full h-auto" alt="Vista Previa Portada" src={coverImageUrl || DEFAULT_COVER_URL} width={1200} height={800} priority sizes="(max-width: 1152px) 100vw, 1152px" />
                            </div>
                        )}

                        <article className="w-full max-w-2xl px-5 md:px-0 mx-auto min-w-0">
                            <div 
                                className={`article-content ${(tipo?.toLowerCase() === 'ensaio' || tipo?.toLowerCase() === PUBLICATION_TYPES.ESSAY) ? 'article-content-essay' : ''}`}
                                dangerouslySetInnerHTML={{ __html: renderHeadingAnchors(renderMathInHtml(activeLang === 'gl' ? contenidoGl : contenidoEs)) }}
                            />
                        </article>

                            <div className="w-full max-w-2xl px-5 md:px-0 mx-auto mt-20 pt-8 border-t border-lines flex items-start gap-6">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-lines relative shrink-0">
                                    <NextImage className="object-cover" alt="Avatar del Autor" src={authorProfile?.avatar_url || DEFAULT_AVATAR_URL} fill sizes="48px"/>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-charcoal uppercase tracking-widest mb-2" id="preview-author-heading">{dict.aboutTheAuthor || 'Sobre o autor'}</h3>
                                    <p className="font-sans text-lg text-charcoal/80">
                                        <strong>{authorProfile?.nombre || dict.defaultAuthorName || 'Autor do Artigo'}</strong> {authorProfile?.bio || dict.defaultBio || 'é un columnista e colaborador activo.'}
                                    </p>
                                </div>
                            </div>
                    </div>
                </div>
            )}
        </>
    );
}
