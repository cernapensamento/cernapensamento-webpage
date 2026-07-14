"use client";

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { DEFAULT_COVER_URL, DEFAULT_AVATAR_URL } from '@/lib/constants';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { createClient } from '@/utils/supabase/client';
import sanitizeHtml from 'sanitize-html';

export interface ArticleData {
    titulo: string;
    subtitulo: string;
    contenido: string;
    imagen_url: string;
    tematicas?: string[];
    estado?: string;
}

interface ArticleEditorProps {
    initialData?: ArticleData;
    onSave: (data: ArticleData, isDraft: boolean) => Promise<void>;
    isPublishing: boolean;
    mode: 'create' | 'edit';
}

export default function ArticleEditor({ initialData, onSave, isPublishing, mode }: ArticleEditorProps) {
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [titulo, setTitulo] = useState(initialData?.titulo || '');
    const [subtitulo, setSubtitulo] = useState(initialData?.subtitulo || '');
    const [coverImageUrl, setCoverImageUrl] = useState(initialData?.imagen_url || '');
    const [tematicas, setTematicas] = useState<string[]>(initialData?.tematicas || []);
    const [tematicaInput, setTematicaInput] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [authorProfile, setAuthorProfile] = useState<{ nombre: string; avatar_url?: string } | null>(null);
    const TEMATICAS_SUGERIDAS = ['ECONOMÍA', 'POLÍTICA', 'CIENCIA', 'FILOSOFÍA', 'TECNOLOGÍA', 'ARTE'];
    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('perfiles')
                    .select('nombre, avatar_url')
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
        extensions: [StarterKit, Image],
        content: initialData?.contenido || (mode === 'create' ? '<p>La naturaleza del pensamiento contemporáneo exige una pausa deliberada...</p>' : ''),
        editorProps: {
            attributes: {
                class: 'w-full border-none bg-transparent font-sans text-lg text-charcoal focus:outline-none min-h-[400px] outline-none prose prose-p:my-4 prose-img:my-8',
            },
        },
    });

    useEffect(() => {
        if (editor && initialData?.contenido && editor.getHTML() !== initialData.contenido) {
            editor.commands.setContent(initialData.contenido);
        }
    }, [editor, initialData?.contenido]);

    const handleChangeCoverImage = () => {
        const url = window.prompt('URL de la imagen de portada:', coverImageUrl);
        if (url !== null) {
            setCoverImageUrl(url);
        }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
    };

    const insertImage = () => {
        const url = window.prompt('URL de la imagen:');
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const handleSubmit = async (isDraft: boolean) => {
        await onSave({
            titulo,
            subtitulo,
            contenido: editor?.getHTML() || '',
            imagen_url: coverImageUrl,
            tematicas: tematicas
        }, isDraft);
        setShowPublishModal(false);
    };

    return (
        <>
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
                            <button className="px-6 py-2 font-sans text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors cursor-pointer" onClick={() => setShowPublishModal(false)}>
                                Cancelar
                            </button>
                            <button className="px-6 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit(false)}>
                                {isPublishing ? (mode === 'create' ? 'Publicando...' : 'Guardando...') : 'Publicar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex flex-grow overflow-hidden relative">
                <div className="flex-grow overflow-y-auto">
                    {/* Floating Toolbar */}
                    <div className="sticky top-0 z-30 border-b border-lines bg-parchment/80 backdrop-blur-sm px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-charcoal/80">
                            <button className={`w-10 h-10 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('bold') ? 'bg-lines/30' : ''}`} title="Negrita" onClick={() => editor?.chain().focus().toggleBold().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_bold</span></button>
                            <button className={`w-10 h-10 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('italic') ? 'bg-lines/30' : ''}`} title="Cursiva" onClick={() => editor?.chain().focus().toggleItalic().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_italic</span></button>
                            <button className={`w-10 h-10 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('blockquote') ? 'bg-lines/30' : ''}`} title="Cita" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_quote</span></button>
                            <div className="h-6 w-[1px] bg-lines mx-2"></div>
                            <button className="w-10 h-10 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Imagen" onClick={insertImage}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>image</span></button>
                            <button className={`w-10 h-10 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer ${editor?.isActive('bulletList') ? 'bg-lines/30' : ''}`} title="Lista" onClick={() => editor?.chain().focus().toggleBulletList().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_list_bulleted</span></button>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-sans uppercase tracking-widest text-charcoal/50 italic hidden sm:block"></span>
                            <button className="px-4 py-2 border border-charcoal/30 text-charcoal/70 text-xs font-sans uppercase tracking-widest hover:border-charcoal hover:text-charcoal transition-all cursor-pointer flex items-center gap-1.5" onClick={handleChangeCoverImage}>
                                <span className="material-symbols-outlined text-[16px]" style={{ fontFamily: 'Material Symbols Outlined' }}>add_a_photo</span>
                                Imagen de Portada
                            </button>
                            <button className="px-4 py-2 border border-charcoal/30 text-charcoal/70 text-xs font-sans uppercase tracking-widest hover:border-charcoal hover:text-charcoal transition-all cursor-pointer flex items-center gap-1.5" onClick={() => setShowPreview(true)}>
                                <span className="material-symbols-outlined text-[16px]" style={{ fontFamily: 'Material Symbols Outlined' }}>visibility</span>
                                Vista Previa
                            </button>
                            {mode === 'edit' && initialData?.estado === 'publicado' ? (
                                <button className="px-4 py-2 border border-charcoal text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit(true)}>Despublicar a Borrador</button>
                            ) : (
                                <button className="px-4 py-2 border border-charcoal text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={() => handleSubmit(true)}>Guardar Borrador</button>
                            )}
                            <button className="px-4 py-2 bg-charcoal text-parchment text-xs font-sans uppercase tracking-widest hover:bg-gold transition-all cursor-pointer" onClick={() => setShowPublishModal(true)}>
                                {mode === 'create' ? 'Publicar' : 'Publicar Cambios'}
                            </button>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="max-w-[800px] mx-auto py-16 px-8 editor-container [&_blockquote]:border-l-4 [&_blockquote]:border-gold [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-charcoal/80 [&_blockquote]:my-6 [&_ul]:list-disc [&_ul]:ml-8 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:ml-8 [&_ol]:my-4 [&_li]:my-2">
                        <div className="space-y-12">
                            {/* Category & Title */}
                            <div className="space-y-6 flex flex-col">
                                <div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {tematicas.map(t => (
                                            <span key={t} className="flex items-center gap-1 px-3 py-1 bg-lines/30 text-charcoal text-[10px] uppercase tracking-[0.15em] rounded-sm group cursor-pointer hover:bg-red-500/10 hover:text-red-700 transition-colors" onClick={() => handleRemoveTematica(t)} title="Eliminar temática">
                                                {t}
                                                <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100" style={{ fontFamily: 'Material Symbols Outlined' }}>close</span>
                                            </span>
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
                                        {TEMATICAS_SUGERIDAS.filter(t => !tematicas.includes(t)).map(t => (
                                            <button key={t} onClick={() => handleAddTematica(t)} className="text-[10px] font-sans uppercase tracking-widest text-charcoal/60 hover:text-gold transition-colors cursor-pointer">
                                                +{t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea className="w-full border-none bg-transparent font-serif text-4xl text-charcoal focus:ring-0 placeholder:text-charcoal/30 resize-none overflow-hidden outline-none" onInput={(e) => { handleInput(e); setTitulo((e.target as HTMLTextAreaElement).value); }} placeholder="El título de tu investigación..." value={titulo} rows={1}></textarea>
                                <textarea className="w-full border-none bg-transparent font-serif text-xl text-charcoal/60 italic focus:ring-0 placeholder:text-charcoal/30 resize-none overflow-hidden outline-none" onInput={(e) => { handleInput(e); setSubtitulo((e.target as HTMLTextAreaElement).value); }} placeholder="Un subtítulo o breve resumen que invite a la reflexión profunda..." value={subtitulo} rows={1}></textarea>
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
                        <button className="flex items-center gap-2 px-4 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer" onClick={() => setShowPreview(false)}>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontFamily: 'Material Symbols Outlined' }}>close</span>
                            Cerrar Vista Previa
                        </button>
                    </div>

                    {/* Preview Content Simulating Article View */}
                    <div className="w-full pb-24">
                        <header className="w-full max-w-3xl px-5 md:px-0 pt-20 pb-12 mx-auto text-center">
                            <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">Ensayo</span>
                            <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-6 max-w-4xl mx-auto leading-tight">
                                {titulo || 'Sin Título'}
                            </h1>
                            {subtitulo && (
                                <p className="font-serif text-xl md:text-2xl text-charcoal/60 italic max-w-3xl mx-auto mb-6">
                                    {subtitulo}
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
                                <NextImage className="object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Vista Previa Portada" src={coverImageUrl || DEFAULT_COVER_URL} fill priority />
                            </div>
                        )}

                        <article className="w-full max-w-2xl px-5 md:px-0 mx-auto font-sans text-xl text-charcoal leading-relaxed flex flex-col gap-8 whitespace-pre-wrap">
                            <div 
                                className="flex flex-col gap-8 [&>p:first-of-type]:first-letter-drop [&_img]:w-full [&_img]:my-8 [&_ul]:list-disc [&_ul]:ml-8 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:ml-8 [&_ol]:my-4 [&_li]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gold [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-charcoal/80 [&_blockquote]:my-8"
                                dangerouslySetInnerHTML={{ 
                                    __html: sanitizeHtml(editor?.getHTML() || '', { 
                                        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']) 
                                    }) 
                                }}
                            />

                            <div className="mt-20 pt-8 border-t border-lines flex items-start gap-6">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-lines relative shrink-0">
                                    <NextImage className="object-cover" alt="Avatar del Autor" src={authorProfile?.avatar_url || DEFAULT_AVATAR_URL} fill sizes="48px"/>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-charcoal uppercase tracking-widest mb-2">Sobre el autor</h3>
                                    <p className="font-sans text-lg text-charcoal/80">
                                        {authorProfile?.nombre || 'Autor del Artículo'} es un columnista y colaborador activo.
                                    </p>
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            )}
        </>
    );
}
