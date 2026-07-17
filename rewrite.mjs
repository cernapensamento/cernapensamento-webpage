import fs from 'fs';

let content = fs.readFileSync('src/components/escritorio/ArticleEditor.tsx', 'utf-8');

// 1. imports
content = content.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';"
);

// 2. states & refs
content = content.replace(
  "    const [showPreview, setShowPreview] = useState(false);",
  `    const [showPreview, setShowPreview] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [isUploadingInline, setIsUploadingInline] = useState(false);
    const [uploadedInlineImages, setUploadedInlineImages] = useState<string[]>([]);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const inlineImageRef = useRef<HTMLInputElement>(null);`
);

// 3. immediatelyRender: false
content = content.replace(
  "        content: initialData?.contenido || (mode === 'create' ? '<p>La naturaleza del pensamiento contemporáneo exige una pausa deliberada...</p>' : ''),",
  "        content: initialData?.contenido || (mode === 'create' ? '<p>La naturaleza del pensamiento contemporáneo exige una pausa deliberada...</p>' : ''),\n        immediatelyRender: false,"
);

// 4. handleChangeCoverImage & insertImage logic
content = content.replace(
  `    const handleChangeCoverImage = () => {
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
    };`,
  `    const handleChangeCoverImage = () => {
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

        setIsUploadingCover(true);
        const localPreview = URL.createObjectURL(file);
        setCoverImageUrl(localPreview);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsUploadingCover(false); return; }

        const ext = file.name.split('.').pop();
        const path = \`portadas/\${user.id}/\${Date.now()}.\${ext}\`;

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
        setIsUploadingCover(false);
        if (coverInputRef.current) coverInputRef.current.value = '';
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
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

        setIsUploadingInline(true);
        const localUrl = URL.createObjectURL(file);
        editor.chain().focus().setImage({ src: localUrl }).run();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsUploadingInline(false); return; }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = \`contenido/\${user.id}/\${Date.now()}-\${safeName}\`;

        const { error } = await supabase.storage
            .from('imagenes-articulos')
            .upload(path, file, { upsert: true });

        if (error) {
            alert('Error al subir la imagen: ' + error.message);
        } else {
            const { data: urlData } = supabase.storage
                .from('imagenes-articulos')
                .getPublicUrl(path);
            setUploadedInlineImages(prev => [...prev, urlData.publicUrl]);
            const html = editor.getHTML().replace(localUrl, urlData.publicUrl);
            editor.commands.setContent(html);
        }

        URL.revokeObjectURL(localUrl);
        setIsUploadingInline(false);
        if (inlineImageRef.current) inlineImageRef.current.value = '';
    };`
);

// 5. JSX buttons
content = content.replace(
  `<button aria-label="Insertar Imagen" className={\`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer\`} title="Subir Imagen" onClick={insertImage}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>image</span></button>`,
  `<button aria-label="Insertar Imagen" className={\`w-10 h-10 shrink-0 flex items-center justify-center hover:bg-lines/30 transition-colors cursor-pointer \${isUploadingInline ? 'animate-pulse opacity-50' : ''}\`} title="Subir Imagen" onClick={insertImage} disabled={isUploadingInline}><span className="material-symbols-outlined text-[20px]" style={{ fontFamily: 'Material Symbols Outlined' }}>{isUploadingInline ? 'hourglass_top' : 'image'}</span></button>`
);

content = content.replace(
  `<span className="text-[10px] font-sans uppercase tracking-widest text-charcoal/50 italic hidden xl:block shrink-0"></span>
                            <button aria-label="Subir Imagen de Portada" className="px-3 md:px-4 py-2 shrink-0 border border-charcoal/30 text-charcoal/70 text-[10px] md:text-xs font-sans uppercase tracking-widest hover:border-charcoal hover:text-charcoal transition-all cursor-pointer flex items-center gap-1.5" onClick={handleChangeCoverImage}>
                                <span className="material-symbols-outlined text-[16px]" style={{ fontFamily: 'Material Symbols Outlined' }}>add_a_photo</span>
                                <span className="hidden sm:inline">Portada</span>
                            </button>`,
  `<span className="text-[10px] font-sans uppercase tracking-widest text-charcoal/50 italic hidden xl:block shrink-0"></span>
                            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverFileSelected} />
                            <input ref={inlineImageRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleInlineImageSelected} />
                            <button aria-label="Subir Imagen de Portada" className={\`px-3 md:px-4 py-2 shrink-0 border border-charcoal/30 text-charcoal/70 text-[10px] md:text-xs font-sans uppercase tracking-widest hover:border-charcoal hover:text-charcoal transition-all cursor-pointer flex items-center gap-1.5 \${isUploadingCover ? 'animate-pulse opacity-50' : ''}\`} onClick={handleChangeCoverImage} disabled={isUploadingCover}>
                                <span className="material-symbols-outlined text-[16px]" style={{ fontFamily: 'Material Symbols Outlined' }}>{isUploadingCover ? 'hourglass_top' : 'add_a_photo'}</span>
                                <span className="hidden sm:inline">{isUploadingCover ? 'Subiendo...' : 'Portada'}</span>
                            </button>`
);

fs.writeFileSync('src/components/escritorio/ArticleEditor.tsx', content, 'utf-8');
console.log("Rewrite complete");
