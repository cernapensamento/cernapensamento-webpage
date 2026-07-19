"use client";

import React, { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { DEFAULT_COVER_URL, DEFAULT_AVATAR_URL } from '@/lib/constants';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Figure } from '@/lib/editor/FigureExtension';
import Youtube from '@tiptap/extension-youtube';
import { createClient } from '@/utils/supabase/client';
import sanitizeHtml from 'sanitize-html';

const TEMATICAS_SUGERIDAS = ['ECONOMÍA', 'POLÍTICA', 'CIENCIA', 'FILOSOFÍA', 'TECNOLOGÍA', 'ARTE'];

const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
};

export interface ArticleData {
    id?: string;
    titulo_gl: string;
    titulo_es: string;
    subtitulo_gl: string;
    subtitulo_es: string;
    contenido_gl: string;
    contenido_es: string;
    imagen_url: string;
    tematicas?: string[];
    estado?: string;
    tipo?: string;
    fijado?: boolean;
}

interface ArticleEditorProps {
    initialData?: ArticleData;
    onSave: (data: ArticleData, isDraft: boolean) => Promise<void>;
    isPublishing: boolean;
    mode: 'create' | 'edit';
}

export default function ArticleEditor({ initialData, onSave, isPublishing, mode }: ArticleEditorProps) {
    const [showPublishModal, setShowPublishModal] = useState(false);
    
    // Bilingual state
    const [activeLang, setActiveLang] = useState<'gl'|'es'>('gl');
    const [tituloGl, setTituloGl] = useState(initialData?.titulo_gl || '');
    const [tituloEs, setTituloEs] = useState(initialData?.titulo_es || '');
    const [subtituloGl, setSubtituloGl] = useState(initialData?.subtitulo_gl || '');
    const [subtituloEs, setSubtituloEs] = useState(initialData?.subtitulo_es || '');
    const [contenidoGl, setContenidoGl] = useState(initialData?.contenido_gl || '');
    const [contenidoEs, setContenidoEs] = useState(initialData?.contenido_es || '');
    const [isTranslating, setIsTranslating] = useState(false);
    
    // Fix stale closure for onUpdate
    const activeLangRef = useRef(activeLang);
    useEffect(() => {
        activeLangRef.current = activeLang;
    }, [activeLang]);

    const [tipo, setTipo] = useState(initialData?.tipo || 'artigo');
    const [coverImageUrl, setCoverImageUrl] = useState(initialData?.imagen_url || '');
    const [tematicas, setTematicas] = useState<string[]>(initialData?.tematicas || []);
    const [tematicaInput, setTematicaInput] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const isUploadingCover = useRef(false);
    const isUploadingInline = useRef(false);
    const uploadedInlineImages = useRef<string[]>([]);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const inlineImageRef = useRef<HTMLInputElement>(null);
    const [authorProfile, setAuthorProfile] = useState<{ nombre: string; avatar_url?: string; bio?: string } | null>(null);
    
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
                    .from('perfiles')
                    .select('nombre, avatar_url, bio')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setAuthorProfile(data as any);
                }
            }
        };
        fetchProfile();
    }, []);

    const handleAddTematica = (t: string) => {
        const cleanT = t.trim().toUpperCase();
        if (cleanT && !tematicas.includes(cleanT)) {
            setTematicas([...tematicas, cleanT]);
        }
        setTematicaInput('');
    };

    const handleKeyDownTematica = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTematica(tematicaInput);
        }
    };
    
    const handleRemoveTematica = (t: string) => {
        setTematicas(tematicas.filter(item => item !== t));
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Figure,
            Youtube.configure({
                inline: false,
                width: 800,
                height: 450,
            }),
        ],
        content: initialData?.contenido_gl || (mode === 'create' ? '<p>La naturaleza del pensamiento contemporáneo exige una pausa deliberada...</p>' : ''),
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'w-full border-none bg-transparent font-sans text-lg text-charcoal focus:outline-none min-h-[400px] outline-none prose prose-p:my-4 [&_h1+p]:mt-2 [&_h2+p]:mt-2 [&_h3+p]:mt-2 prose-img:my-8 prose-h1:font-serif prose-h1:font-bold prose-h1:text-4xl prose-h1:md:text-5xl prose-h1:text-charcoal prose-h1:mt-12 prose-h1:mb-0 prose-h1:tracking-tight prose-h2:font-serif prose-h2:font-bold prose-h2:text-3xl prose-h2:md:text-4xl prose-h2:text-charcoal/90 prose-h2:mt-10 prose-h2:mb-0 prose-h2:tracking-tight prose-h3:font-serif prose-h3:font-bold prose-h3:text-2xl prose-h3:md:text-3xl prose-h3:text-charcoal/80 prose-h3:mt-8 prose-h3:mb-0 prose-h3:tracking-tight',
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
                        if (parsed.tituloGl) setTituloGl(parsed.tituloGl);
                        if (parsed.tituloEs) setTituloEs(parsed.tituloEs);
                        if (parsed.subtituloGl) setSubtituloGl(parsed.subtituloGl);
                        if (parsed.subtituloEs) setSubtituloEs(parsed.subtituloEs);
                        if (parsed.tipo) setTipo(parsed.tipo);
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
                        return;
                    } catch (e) {
                        console.error('Error parseando borrador', e);
                    }
                }
            }
            
            if (initialDataRef.current?.contenido_gl) {
                editor.commands.setContent(initialDataRef.current.contenido_gl);
            }
        }
    }, [editor, draftKey]);

    const handleChangeCoverImage = () => {
        coverInputRef.current?.click();
    };

    const handleCoverFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Solo se permiten imágenes JPG, PNG o WebP');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('La imagen no puede superar los 2 MB');
            return;
        }

        isUploadingCover.current = true;
        const localPreview = URL.createObjectURL(file);
        setCoverImageUrl(localPreview);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { isUploadingCover.current = false; return; }

        const ext = file.name.split('.').pop();
        const path = `portadas/${user.id}/${Date.now()}.${ext}`;

        const { error } = await supabase.storage
            .from('imagenes-articulos')
            .upload(path, file, { upsert: true });

        if (error) {
            alert('Error al subir la imagen: ' + error.message);
            setCoverImageUrl('');
        } else {
            if (coverImageUrl && coverImageUrl.includes('supabase.co/storage/v1/object/public/imagenes-articulos/')) {
                const oldPath = coverImageUrl.split('imagenes-articulos/')[1];
                if (oldPath) supabase.storage.from('imagenes-articulos').remove([oldPath]).catch(console.error);
            }

            const { data: urlData } = supabase.storage
                .from('imagenes-articulos')
                .getPublicUrl(path);
            setCoverImageUrl(urlData.publicUrl);
        }

        URL.revokeObjectURL(localPreview);
        isUploadingCover.current = false;
        if (coverInputRef.current) coverInputRef.current.value = '';
    };

    const insertImage = () => {
        inlineImageRef.current?.click();
    };

    const handleInlineImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Solo se permiten imágenes JPG, PNG o WebP');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('La imagen no puede superar los 2 MB');
            return;
        }

        isUploadingInline.current = true;
        const localUrl = URL.createObjectURL(file);
        
        const caption = window.prompt('Opcional: Añade una leyenda o pie de foto para esta imagen:');
        
        (editor.chain().focus() as any).setFigure({ 
            src: localUrl, 
            alt: caption || '', 
            title: caption || '', 
            caption: caption 
        }).run();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { isUploadingInline.current = false; return; }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `contenido/${user.id}/${Date.now()}-${safeName}`;

        const { error } = await supabase.storage
            .from('imagenes-articulos')
            .upload(path, file, { upsert: true });

        if (error) {
            alert('Error al subir la imagen: ' + error.message);
        } else {
            const { data: urlData } = supabase.storage
                .from('imagenes-articulos')
                .getPublicUrl(path);
            uploadedInlineImages.current.push(urlData.publicUrl);
            const html = editor.getHTML().replace(localUrl, urlData.publicUrl);
            editor.commands.setContent(html);
        }

        URL.revokeObjectURL(localUrl);
        isUploadingInline.current = false;
        if (inlineImageRef.current) inlineImageRef.current.value = '';
    };

    const insertYoutube = () => {
        const url = window.prompt('URL del vídeo de YouTube:');
        if (url && editor) {
            editor.commands.setYoutubeVideo({
                src: url,
            });
        }
    };

    const handleTranslate = async () => {
        if (!editor) return;
        setIsTranslating(true);
        const sourceLang = activeLang;
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
            alert('Traducción generada correctamente. Puedes cambiar de idioma en las pestañas para revisarla.');
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Error al traducir el contenido. Revisa la consola o tu API KEY.');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleClearAll = () => {
        if (window.confirm('¿Estás seguro de que quieres borrar todo el contenido de este artículo? Se perderán todos los cambios en gallego y en castellano.')) {
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

    const handleSubmit = async (isDraft: boolean) => {
        const currentHtml = editor?.getHTML() || '';
        
        // --- LIMPIEZA DE IMÁGENES INLINE (GARBAGE COLLECTION) ---
        const supabaseRegex = /https:\/\/[a-zA-Z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/imagenes-articulos\/contenido\/[a-zA-Z0-9-]+\/[^"'\s]+/g;
        
        const oldUrls: string[] = [
            ...(initialData?.contenido_gl?.match(supabaseRegex) || []),
            ...(initialData?.contenido_es?.match(supabaseRegex) || [])
        ];
        const newUrls: string[] = [
            ...(contenidoGl.match(supabaseRegex) || []),
            ...(contenidoEs.match(supabaseRegex) || [])
        ];
        
        const newUrlsSet = new Set(newUrls);
        const urlsToDelete = oldUrls.filter(url => !newUrlsSet.has(url));
        const uploadedButDeleted = uploadedInlineImages.current.filter(url => !newUrlsSet.has(url));
        
        const allUrlsToDelete = Array.from(new Set([...urlsToDelete, ...uploadedButDeleted]));
        
        if (allUrlsToDelete.length > 0) {
            const pathsToDelete = allUrlsToDelete.flatMap(url => {
                const parts = url.split('imagenes-articulos/');
                return parts[1] ? [parts[1]] : [];
            });
            
            if (pathsToDelete.length > 0) {
                supabase.storage.from('imagenes-articulos').remove(pathsToDelete).catch(console.error);
            }
        }
        // ---------------------------------------------------------

        await onSave({
            titulo_gl: tituloGl,
            titulo_es: tituloEs,
            subtitulo_gl: subtituloGl,
            subtitulo_es: subtituloEs,
            contenido_gl: activeLang === 'gl' ? currentHtml : contenidoGl,
            contenido_es: activeLang === 'es' ? currentHtml : contenidoEs,
            imagen_url: coverImageUrl,
            tematicas: tematicas,
            tipo: tipo,
        }, isDraft);

        localStorage.removeItem(draftKey);
        setHasUnsavedChanges(false);
        setShowPublishModal(false);
    };

    const tematicasSet = new Set(tematicas);

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
                            {mode === 'create' ? '¿Publicar artículo?' : '¿Publicar cambios?'}
                        </h2>
                        <p className="font-sans text-sm text-charcoal/70 mb-8">
                            {mode === 'create' 
                                ? '¿Estás seguro de que quieres publicar este artículo ahora? Será visible para tu audiencia seleccionada.'
                                : '¿Estás seguro de que quieres guardar y publicar los cambios de este artículo?'}
                        </p>
                        <div className="flex justify-end gap-4">
                            <button type="button" className="px-6 py-2 font-sans text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors cursor-pointer" onClick={() => setShowPublishModal(false)}>
                                Cancelar
                            </button>
                            <button type="button" className="px-6 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit(false)}>
                                {isPublishing ? (mode === 'create' ? 'Publicando...' : 'Guardando...') : 'Publicar'}
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
                            <button type="button" aria-label="Negrita" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('bold') ? 'bg-lines/30' : ''}`} title="Negrita" onClick={() => editor?.chain().focus().toggleBold().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_bold</span></button>
                            <button type="button" aria-label="Cursiva" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('italic') ? 'bg-lines/30' : ''}`} title="Cursiva" onClick={() => editor?.chain().focus().toggleItalic().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_italic</span></button>
                            <div className="h-6 w-[1px] shrink-0 bg-lines mx-2"></div>
                            <button type="button" aria-label="Título 1" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer font-serif font-bold ${editor?.isActive('heading', { level: 1 }) ? 'bg-lines/30' : ''}`} title="Título 1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
                            <button type="button" aria-label="Título 2" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer font-serif font-bold ${editor?.isActive('heading', { level: 2 }) ? 'bg-lines/30' : ''}`} title="Título 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
                            <button type="button" aria-label="Título 3" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer font-serif font-bold ${editor?.isActive('heading', { level: 3 }) ? 'bg-lines/30' : ''}`} title="Título 3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
                            <div className="h-6 w-[1px] shrink-0 bg-lines mx-2"></div>
                            <button type="button" aria-label="Cita" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('blockquote') ? 'bg-lines/30' : ''}`} title="Cita" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_quote</span></button>
                            <button type="button" aria-label="Insertar Imagen" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Imagen" onClick={insertImage}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>image</span></button>
                            <button type="button" aria-label="Insertar Vídeo" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Vídeo de YouTube" onClick={insertYoutube}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>smart_display</span></button>
                            <button type="button" aria-label="Lista con viñetas" className={`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('bulletList') ? 'bg-lines/30' : ''}`} title="Lista" onClick={() => editor?.chain().focus().toggleBulletList().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_list_bulleted</span></button>
                            <div className="h-6 w-[1px] shrink-0 bg-lines mx-2"></div>
                            <button type="button" aria-label="Limpiar todo" className="w-10 h-10 shrink-0 flex items-center justify-center text-error hover:bg-error/10 transition-colors cursor-pointer" title="Limpiar Todo" onClick={handleClearAll}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>delete_sweep</span></button>
                            <button type="button" aria-label="Cambiar Imagen de Portada" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Portada" onClick={handleChangeCoverImage}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>add_a_photo</span></button>
                            <button type="button" aria-label="Vista Previa" className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Vista Previa" onClick={() => setShowPreview(true)}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>visibility</span></button>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 scrollbar-none">
                            <span className="text-[10px] font-sans uppercase tracking-widest text-charcoal/50 italic hidden xl:block shrink-0"></span>
                            {mode === 'edit' && initialData?.estado === 'publicado' ? (
                                <button type="button" className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit(true)}>
                                    <span className="hidden sm:inline">Despublicar</span>
                                    <span className="sm:hidden">Despublicar</span>
                                </button>
                            ) : (
                                <button type="button" className="px-3 md:px-4 py-2 shrink-0 border border-charcoal text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit(true)}>
                                    <span className="hidden sm:inline">Guardar Borrador</span>
                                    <span className="sm:hidden">Borrador</span>
                                </button>
                            )}
                            <button type="button" className="px-3 md:px-4 py-2 shrink-0 bg-charcoal text-parchment text-[10px] md:text-xs font-sans uppercase tracking-widest hover:bg-gold transition-all cursor-pointer" onClick={() => setShowPublishModal(true)}>
                                {mode === 'create' ? 'Publicar' : 'Publicar'}
                            </button>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="max-w-[800px] mx-auto py-8 px-8 editor-container [&_h1+p]:mt-2 [&_h2+p]:mt-2 [&_h3+p]:mt-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gold [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-charcoal/80 [&_blockquote]:my-6 [&_ul]:list-disc [&_ul]:ml-8 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:ml-8 [&_ol]:my-4 [&_li]:my-2 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:my-8 [&_div[data-youtube-video]]:w-full [&_div[data-youtube-video]]:flex [&_div[data-youtube-video]]:justify-center [&_h1]:font-serif [&_h1]:font-bold [&_h1]:text-4xl [&_h1]:md:text-5xl [&_h1]:text-charcoal [&_h1]:mt-12 [&_h1]:mb-0 [&_h1]:tracking-tight [&_h2]:font-serif [&_h2]:font-bold [&_h2]:text-3xl [&_h2]:md:text-4xl [&_h2]:text-charcoal/90 [&_h2]:mt-10 [&_h2]:mb-0 [&_h2]:tracking-tight [&_h3]:font-serif [&_h3]:font-bold [&_h3]:text-2xl [&_h3]:md:text-3xl [&_h3]:text-charcoal/80 [&_h3]:mt-8 [&_h3]:mb-0 [&_h3]:tracking-tight">
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
                                {isTranslating ? 'Traduciendo...' : `Traducir a ${activeLang === 'gl' ? 'Castellano' : 'Galego'}`}
                            </button>
                        </div>
                        
                        <div className="space-y-12">
                            {/* Category & Title */}
                            <div className="space-y-6 flex flex-col">
                                <div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {tematicas.map(t => (
                                            <button type="button" key={t} className="flex items-center gap-1 px-3 py-1 bg-lines/30 text-charcoal text-[10px] uppercase tracking-[0.15em] rounded-sm group cursor-pointer hover:bg-red-500/10 hover:text-red-700 transition-colors" onClick={() => handleRemoveTematica(t)} title="Eliminar temática">
                                                {t}
                                                <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100" style={{ fontFamily: 'Material Symbols Outlined' }}>close</span>
                                            </button>
                                        ))}
                                        <input 
                                            className="flex-grow min-w-[200px] border-none bg-transparent font-sans text-xs text-gold tracking-[0.2em] uppercase focus:ring-0 placeholder:text-charcoal/30 outline-none p-1" 
                                            placeholder={tematicas.length === 0 ? "AÑADE TEMÁTICAS (ENTER PARA GUARDAR)" : "AÑADIR OTRA..."} 
                                            type="text" 
                                            value={tematicaInput} 
                                            onChange={(e) => setTematicaInput(e.target.value)} 
                                            onKeyDown={handleKeyDownTematica}
                                            onBlur={() => { if (tematicaInput) handleAddTematica(tematicaInput); }}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <span className="text-[10px] font-sans uppercase tracking-widest text-charcoal/50">Sugerencias:</span>
                                        {TEMATICAS_SUGERIDAS.filter(t => !tematicasSet.has(t)).map(t => (
                                            <button type="button" key={t} onClick={() => handleAddTematica(t)} className="text-[10px] font-sans uppercase tracking-widest text-charcoal/60 hover:text-gold transition-colors cursor-pointer">
                                                +{t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <select 
                                        aria-label="Tipo de artículo"
                                        className="bg-transparent text-gold uppercase text-xs tracking-widest font-bold border border-lines p-2 focus:outline-none focus:border-gold cursor-pointer"
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        style={{ colorScheme: 'light dark' }}
                                    >
                                        <option value="artigo" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>Artigo</option>
                                        <option value="ensaio" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>Ensaio</option>
                                        <option value="reportaxe" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>Reportaxe</option>
                                        <option value="columna" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>Columna</option>
                                        <option value="entrevista" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>Entrevista</option>
                                        <option value="poesía" style={{ backgroundColor: 'var(--dynamic-surface)', color: 'var(--dynamic-charcoal)' }}>Poesía</option>
                                    </select>
                                </div>
                                <textarea 
                                    className="w-full border-none bg-transparent font-serif text-4xl text-charcoal focus:ring-0 placeholder:text-charcoal/30 resize-none overflow-hidden outline-none" 
                                    onInput={(e) => { 
                                        handleInput(e); 
                                        if (activeLang === 'gl') setTituloGl((e.target as HTMLTextAreaElement).value);
                                        else setTituloEs((e.target as HTMLTextAreaElement).value);
                                    }} 
                                    placeholder={activeLang === 'gl' ? "O título da túa investigación..." : "El título de tu investigación..."} 
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
                                    placeholder={activeLang === 'gl' ? "Un subtítulo ou breve resumo..." : "Un subtítulo o breve resumen..."} 
                                    value={activeLang === 'gl' ? subtituloGl : subtituloEs} 
                                    rows={1}
                                />
                            </div>
                            <div className="h-[1px] w-12 bg-gold opacity-30"></div>
                            {/* Body Content */}
                            <div className="space-y-8">
                                <EditorContent editor={editor} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-parchment">
                    {/* Preview TopBar */}
                    <div className="sticky top-0 z-50 border-b border-lines bg-parchment/95 backdrop-blur-sm px-8 py-4 flex items-center justify-between">
                        <span className="font-sans text-[10px] text-gold uppercase tracking-[0.2em]">Vista Previa de Publicación</span>
                        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer" onClick={() => setShowPreview(false)}>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontFamily: 'Material Symbols Outlined' }}>close</span>
                            Cerrar Vista Previa
                        </button>
                    </div>

                    {/* Preview Content Simulating Article View */}
                    <div className="w-full pb-24">
                        <header className="w-full max-w-3xl px-5 md:px-0 pt-20 pb-12 mx-auto text-center">
                            <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">{tipo || 'Artículo'}</span>
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
                                <time className="uppercase tracking-widest">
                                    {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </time>
                            </div>
                        </header>

                        {coverImageUrl && (
                            <div className="w-full h-[50vh] min-h-[350px] mb-16 border-y border-lines bg-lines/30 relative">
                                <NextImage className="object-cover" alt="Vista Previa Portada" src={coverImageUrl || DEFAULT_COVER_URL} fill priority sizes="100vw" />
                            </div>
                        )}

                        <article className="w-full max-w-2xl px-5 md:px-0 mx-auto font-sans text-xl text-charcoal leading-relaxed flex flex-col gap-2 whitespace-pre-wrap">
                            <div 
                                className="prose prose-lg max-w-none text-charcoal
                        [&>p]:mb-6 [&>p]:leading-relaxed
                        [&>h2]:font-serif [&>h2]:text-3xl [&>h2]:mt-12 [&>h2]:mb-6
                        [&>h3]:font-serif [&>h3]:text-2xl [&>h3]:mt-10 [&>h3]:mb-4
                        [&>blockquote]:border-l-4 [&>blockquote]:border-gold [&>blockquote]:pl-6 [&>blockquote]:font-serif [&>blockquote]:text-2xl [&>blockquote]:italic [&>blockquote]:text-charcoal/80 [&>blockquote]:my-10
                        [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6
                        [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6
                        [&>li]:mb-2
                        [&>figure]:my-10 [&>figure]:mx-0 [&>figure]:w-full [&>figure>img]:w-full [&>figure>img]:h-auto [&>figure>img]:border [&>figure>img]:border-lines
                        [&_figure_figcaption]:mt-4 [&_figure_figcaption]:text-base [&_figure_figcaption]:text-charcoal/60 [&_figure_figcaption]:italic [&_figure_figcaption]:text-center
                        [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-gold/80"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeLang === 'gl' ? contenidoGl : contenidoEs, {
                                    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'iframe', 'div', 'figure', 'figcaption']),
                                    allowedAttributes: {
                                        ...sanitizeHtml.defaults.allowedAttributes,
                                        iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
                                        div: ['data-youtube-video']
                                    },
                                    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'youtu.be']
                                }) }}
                            />
                        </article>

                            <div className="mt-20 pt-8 border-t border-lines flex items-start gap-6">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-lines relative shrink-0">
                                    <NextImage className="object-cover" alt="Avatar del Autor" src={authorProfile?.avatar_url || DEFAULT_AVATAR_URL} fill sizes="48px"/>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-charcoal uppercase tracking-widest mb-2" id="preview-author-heading">Sobre el autor</h3>
                                    <p className="font-sans text-lg text-charcoal/80">
                                        <strong>{authorProfile?.nombre || 'Autor del Artículo'}</strong> {authorProfile?.bio || 'es un columnista y colaborador activo.'}
                                    </p>
                                </div>
                            </div>
                    </div>
                </div>
            )}
        </>
    );
}
