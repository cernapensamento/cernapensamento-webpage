import fs from 'fs';

let content = fs.readFileSync('src/components/escritorio/ArticleEditor.tsx', 'utf-8');

const target = `    const handleSubmit = async (isDraft: boolean) => {
        const currentHtml = editor?.getHTML() || '';
        
        // --- LIMPIEZA DE IMÁGENES INLINE (GARBAGE COLLECTION) ---
        const supabaseRegex = /https:\\/\\/[a-zA-Z0-9.-]+\\.supabase\\.co\\/storage\\/v1\\/object\\/public\\/imagenes-articulos\\/contenido\\/[a-zA-Z0-9-]+\\/[^"'\\s]+/g;
        
        const oldUrls: string[] = initialData?.contenido?.match(supabaseRegex) || [];
        const newUrls: string[] = currentHtml.match(supabaseRegex) || [];
        
        const urlsToDelete = oldUrls.filter(url => !newUrls.includes(url));
        const uploadedButDeleted = uploadedInlineImages.filter(url => !newUrls.includes(url));
        
        const allUrlsToDelete = Array.from(new Set([...urlsToDelete, ...uploadedButDeleted]));
        
        if (allUrlsToDelete.length > 0) {
            const pathsToDelete = allUrlsToDelete.map(url => {
                const parts = url.split('imagenes-articulos/');
                return parts[1];
            }).filter(Boolean) as string[];
            
            if (pathsToDelete.length > 0) {
                supabase.storage.from('imagenes-articulos').remove(pathsToDelete).catch(console.error);
            }
        }
        // ---------------------------------------------------------

        await onSave({
            titulo,
            subtitulo,
            contenido: currentHtml,
            imagen_url: coverImageUrl,
            tematicas: tematicas,
            tipo: tipo
        }, isDraft);
        setShowPublishModal(false);
    };`;

content = content.replace(
    `    const handleSubmit = async (isDraft: boolean) => {
        await onSave({
            titulo,
            subtitulo,
            contenido: editor?.getHTML() || '',
            imagen_url: coverImageUrl,
            tematicas: tematicas,
            tipo: tipo
        }, isDraft);
        setShowPublishModal(false);
    };`,
    target
);

fs.writeFileSync('src/components/escritorio/ArticleEditor.tsx', content, 'utf-8');
console.log("Patched handleSubmit");
