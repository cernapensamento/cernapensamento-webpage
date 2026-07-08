"use client";

import React, { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { DEFAULT_COVER_URL } from '@/lib/constants';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from 'next/link';

export default function NuevoArticulo() {
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const editor = useEditor({
        extensions: [StarterKit, Image],
        content: '<p>La naturaleza del pensamiento contemporáneo exige una pausa deliberada...</p>',
        editorProps: {
            attributes: {
                class: 'w-full border-none bg-transparent font-sans text-lg text-charcoal focus:outline-none min-h-[400px] outline-none prose prose-p:my-4 prose-img:my-8',
            },
        },
    });

    const handleChangeCoverImage = () => {
        const url = window.prompt('URL de la imagen de portada:', coverImageUrl);
        if (url !== null) {
            setCoverImageUrl(url);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Debes iniciar sesión para publicar');
                return;
            }

            const contenidoHtml = editor?.getHTML() || '';

            const { data, error } = await supabase.from('articulos').insert({
                titulo: titulo || 'Sin Título',
                contenido: contenidoHtml,
                autor_id: user.id,
                imagen_url: coverImageUrl || null
            }).select().single();

            if (error) {
                console.error(error);
                alert('Error al publicar: ' + error.message);
            } else {
                alert('¡Artículo publicado con éxito!');
                setShowPublishModal(false);
                router.push('/escritorio');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsPublishing(false);
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

  return (
    <>
      {showPublishModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm">
              <div className="bg-surface p-8 max-w-md w-full border border-lines shadow-2xl">
                  <h2 className="font-serif text-2xl text-charcoal mb-4">¿Publicar artículo?</h2>
                  <p className="font-sans text-sm text-charcoal/70 mb-8">
                      ¿Estás seguro de que quieres publicar este artículo ahora? Será visible para tu audiencia seleccionada.
                  </p>
                  <div className="flex justify-end gap-4">
                      <button className="px-6 py-2 font-sans text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors cursor-pointer" onClick={() => setShowPublishModal(false)}>
                          Cancelar
                      </button>
                      <button className="px-6 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer disabled:opacity-50" disabled={isPublishing} onClick={handlePublish}>
                          {isPublishing ? 'Publicando...' : 'Publicar'}
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
                      <button className="w-10 h-10 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer" title="Lista" onClick={() => editor?.chain().focus().toggleBulletList().run()}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>format_list_bulleted</span></button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-sans uppercase tracking-widest text-charcoal/50 italic hidden sm:block">Guardado hace 2 min</span>
                      <button className="px-4 py-2 border border-charcoal text-xs font-sans uppercase tracking-widest hover:bg-charcoal hover:text-parchment transition-all cursor-pointer">Vista Previa</button>
                      <button className="px-4 py-2 bg-charcoal text-parchment text-xs font-sans uppercase tracking-widest hover:bg-gold transition-all cursor-pointer" onClick={() => setShowPublishModal(true)}>Publicar</button>
                    </div>
                  </div>

                  {/* Editor Area */}
                  <div className="max-w-[800px] mx-auto py-16 px-8 editor-container">
                    <div className="space-y-12">
                      {/* Category & Title */}
                      <div className="space-y-6 flex flex-col">
                        <input className="w-full border-none bg-transparent font-sans text-xs text-gold tracking-[0.2em] uppercase focus:ring-0 placeholder:text-charcoal/30 outline-none" placeholder="CATEGORÍA (E.G. FILOSOFÍA, POLÍTICA)" type="text"/>
                        <textarea className="w-full border-none bg-transparent font-serif text-4xl text-charcoal focus:ring-0 placeholder:text-charcoal/30 resize-none overflow-hidden outline-none" onInput={(e) => { handleInput(e); setTitulo((e.target as HTMLTextAreaElement).value); }} placeholder="El título de tu investigación..." rows={1}></textarea>
                        <textarea className="w-full border-none bg-transparent font-serif text-xl text-charcoal/60 italic focus:ring-0 placeholder:text-charcoal/30 resize-none overflow-hidden outline-none" onInput={handleInput} placeholder="Un subtítulo o breve resumen que invite a la reflexión profunda..." rows={1}></textarea>
                      </div>
                      <div className="h-[1px] w-12 bg-gold opacity-30"></div>
                      {/* Body Content */}
                      <div className="space-y-8">
                        <EditorContent editor={editor} />
                      </div>
                    </div>
                  </div>
              </div>

              {/* Right Settings Sidebar */}
              <aside className="hidden xl:flex flex-col w-80 h-full border-l border-lines bg-surface flex-shrink-0 overflow-y-auto p-8">
                <h3 className="font-sans text-xs uppercase tracking-widest text-charcoal mb-8 pb-4 border-b border-lines">Ajustes de Publicación</h3>
                <div className="space-y-8">
                  {/* Cover Image */}
                  <div className="space-y-4">
                    <label className="font-sans text-[10px] text-charcoal/60 uppercase tracking-wider">Imagen de Portada</label>
                    <div className="relative aspect-video bg-lines/30 border border-dashed border-lines hover:bg-lines/50 transition-colors cursor-pointer flex flex-col items-center justify-center group overflow-hidden" onClick={handleChangeCoverImage}>
                      <NextImage className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="Cover" src={coverImageUrl || DEFAULT_COVER_URL} fill/>
                      <div className="relative z-10 flex flex-col items-center bg-surface/80 p-2 rounded hover:bg-surface transition-colors">
                        <span className="material-symbols-outlined text-charcoal mb-2" style={{ fontFamily: 'Material Symbols Outlined' }}>add_a_photo</span>
                        <span className="font-sans text-[10px] text-charcoal uppercase tracking-widest">Cambiar imagen</span>
                      </div>
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="space-y-4">
                    <label className="font-sans text-[10px] text-charcoal/60 uppercase tracking-wider">Etiquetas</label>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-parchment border border-lines text-[10px] font-sans uppercase tracking-widest flex items-center gap-2 text-charcoal">
                        Metafísica <button className="material-symbols-outlined text-[14px] cursor-pointer" style={{ fontFamily: 'Material Symbols Outlined' }}>close</button>
                      </span>
                      <span className="px-3 py-1 bg-parchment border border-lines text-[10px] font-sans uppercase tracking-widest flex items-center gap-2 text-charcoal">
                        Ética <button className="material-symbols-outlined text-[14px] cursor-pointer" style={{ fontFamily: 'Material Symbols Outlined' }}>close</button>
                      </span>
                      <button className="px-3 py-1 border border-dashed border-lines text-[10px] font-sans uppercase tracking-widest hover:bg-parchment transition-colors text-charcoal cursor-pointer">+ Añadir</button>
                    </div>
                  </div>
                  {/* Scheduling */}
                  <div className="space-y-4">
                    <label className="font-sans text-[10px] text-charcoal/60 uppercase tracking-wider">Programación</label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border-b border-lines">
                        <span className="font-sans text-sm text-charcoal">Fecha</span>
                        <span className="font-sans text-xs text-gold uppercase tracking-widest">24 Mayo, 2024</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border-b border-lines">
                        <span className="font-sans text-sm text-charcoal">Hora</span>
                        <span className="font-sans text-xs text-gold uppercase tracking-widest">08:00 AM</span>
                      </div>
                    </div>
                  </div>
                  {/* Visiblity */}
                  <div className="space-y-4">
                    <label className="font-sans text-[10px] text-charcoal/60 uppercase tracking-wider">Visibilidad</label>
                    <select className="w-full bg-transparent border-b border-lines focus:border-charcoal focus:ring-0 font-sans text-sm py-2 px-0 text-charcoal outline-none">
                      <option>Público</option>
                      <option>Sólo suscriptores</option>
                      <option>Borrador privado</option>
                    </select>
                  </div>
                </div>
              </aside>
          </div>
    </>
  );
}
