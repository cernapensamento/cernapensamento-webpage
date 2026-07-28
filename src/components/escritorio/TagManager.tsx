"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface TagManagerProps {
    selectedTags: string[]; // For backwards compatibility we can keep string[] for now, or object array
    onChange: (tags: string[]) => void;
}

export default function TagManager({ selectedTags, onChange }: TagManagerProps) {
    const supabase = createClient();
    const [allTags, setAllTags] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    
    const [newTagEs, setNewTagEs] = useState('');
    const [newTagGl, setNewTagGl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('slug, tag_translations(lang, name)');
            
            if (!error && data) {
                setAllTags(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddExisting = (slug: string) => {
        if (!selectedTags.includes(slug)) {
            onChange([...selectedTags, slug]);
        }
        setSearch('');
    };

    const handleRemove = (slug: string) => {
        onChange(selectedTags.filter(t => t !== slug));
    };

    const handleCreateNew = async () => {
        if (!newTagEs || !newTagGl) return alert('Debes completar ambos idiomas');
        setIsSaving(true);
        try {
            // Generar slug del término en castellano
            const slug = newTagEs.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            
            // Insertar tag
            const { data: tag, error: tagError } = await supabase
                .from('tags')
                .insert({ slug })
                .select().single();
                
            if (tagError) throw tagError;
            
            // Insertar traducciones
            const { error: transError } = await supabase
                .from('tag_translations')
                .insert([
                    { tag_id: tag.id, lang: 'es', name: newTagEs },
                    { tag_id: tag.id, lang: 'gl', name: newTagGl }
                ]);
                
            if (transError) throw transError;
            
            await fetchTags();
            handleAddExisting(slug);
            setShowModal(false);
            setNewTagEs('');
            setNewTagGl('');
        } catch (e: any) {
            alert('Error al crear etiqueta: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getTranslatedName = (tag: any, targetLang: string) => {
        const trans = tag.tag_translations?.find((t: any) => t.lang === targetLang);
        return trans ? trans.name : tag.slug;
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map(slug => {
                    const tagObj = allTags.find(t => t.slug === slug);
                    const name = tagObj ? getTranslatedName(tagObj, 'es') : slug;
                    return (
                        <button type="button" key={slug} className="flex items-center gap-1 px-3 py-1 bg-lines/30 text-charcoal text-[10px] uppercase tracking-[0.15em] rounded-sm group cursor-pointer hover:bg-red-500/10 hover:text-red-700 transition-colors" onClick={() => handleRemove(slug)} title="Eliminar temática">
                            {name}
                            <span className="material-symbols-outlined text-[12px] opacity-50 group-hover:opacity-100" style={{ fontFamily: 'Material Symbols Outlined' }}>close</span>
                        </button>
                    );
                })}
            </div>
            
            <div className="relative">
                <input 
                    className="w-full border border-lines bg-transparent font-sans text-xs text-charcoal tracking-widest uppercase focus:outline-none focus:border-gold p-2" 
                    placeholder="BUSCAR O AÑADIR ETIQUETA..." 
                    type="text" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
                
                {search && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-lines shadow-lg z-50 max-h-48 overflow-y-auto">
                        {allTags.filter(t => 
                            t.slug.includes(search.toLowerCase()) || 
                            t.tag_translations?.some((tr: any) => tr.name.toLowerCase().includes(search.toLowerCase()))
                        ).map(t => (
                            <button type="button" key={t.slug} className="w-full text-left px-4 py-2 text-xs uppercase tracking-widest hover:bg-gold/10 hover:text-gold transition-colors" onClick={() => handleAddExisting(t.slug)}>
                                {getTranslatedName(t, 'es')} <span className="text-[10px] text-charcoal/50">({getTranslatedName(t, 'gl')})</span>
                            </button>
                        ))}
                        
                        <button type="button" className="w-full text-left px-4 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-parchment transition-colors border-t border-lines" onClick={() => setShowModal(true)}>
                            + CREAR NUEVA ETIQUETA "{search}"
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm">
                    <div className="bg-surface p-8 max-w-md w-full border border-lines shadow-2xl">
                        <h2 className="font-serif text-2xl text-charcoal mb-4">Nueva Etiqueta</h2>
                        <p className="text-xs font-sans text-charcoal/70 mb-6 uppercase tracking-widest">
                            Las etiquetas deben estar disponibles en ambos idiomas para la correcta traducción del sitio.
                        </p>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-charcoal/70 mb-1">En Castellano</label>
                                <input type="text" className="w-full border border-lines p-2 bg-transparent focus:border-gold outline-none" value={newTagEs} onChange={e => setNewTagEs(e.target.value)} placeholder="Ej: Medio Ambiente" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-charcoal/70 mb-1">En Galego</label>
                                <input type="text" className="w-full border border-lines p-2 bg-transparent focus:border-gold outline-none" value={newTagGl} onChange={e => setNewTagGl(e.target.value)} placeholder="Ej: Medio Ambiente" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button type="button" className="px-6 py-2 font-sans text-xs uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors cursor-pointer" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button type="button" className="px-6 py-2 bg-charcoal text-parchment font-sans text-xs uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer disabled:opacity-50" disabled={isSaving} onClick={handleCreateNew}>
                                {isSaving ? 'Guardando...' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
