import fs from 'fs';

const path = 'src/components/escritorio/ArticleEditor.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add uploadedInlineImages state
content = content.replace(
  'const [isUploadingInline, setIsUploadingInline] = useState(false);',
  'const [isUploadingInline, setIsUploadingInline] = useState(false);\n    const [uploadedInlineImages, setUploadedInlineImages] = useState<string[]>([]);'
);

// 2. Cover image GC
content = content.replace(
  `        if (error) {
            alert('Error al subir la imagen: ' + error.message);
            setCoverImageUrl('');
        } else {
            const { data: urlData } = supabase.storage
                .from('imagenes-articulos')
                .getPublicUrl(path);
            setCoverImageUrl(urlData.publicUrl);
        }`,
  `        if (error) {
            alert('Error al subir la imagen: ' + error.message);
            setCoverImageUrl('');
        } else {
            // Eliminar la imagen anterior si era de Supabase Storage para no acumular basura
            if (coverImageUrl && coverImageUrl.includes('supabase.co/storage/v1/object/public/imagenes-articulos/')) {
                const oldPath = coverImageUrl.split('imagenes-articulos/')[1];
                if (oldPath) {
                    supabase.storage.from('imagenes-articulos').remove([oldPath]).catch(console.error);
                }
            }

            const { data: urlData } = supabase.storage
                .from('imagenes-articulos')
                .getPublicUrl(path);
            setCoverImageUrl(urlData.publicUrl);
        }`
);

// 3. Inline images tracking
content = content.replace(
  `        if (error) {
            alert('Error al subir la imagen: ' + error.message);
        } else {
            const { data: urlData } = supabase.storage
                .from('imagenes-articulos')
                .getPublicUrl(path);
            const html = editor.getHTML().replace(localUrl, urlData.publicUrl);
            editor.commands.setContent(html);
        }`,
  `        if (error) {
            alert('Error al subir la imagen: ' + error.message);
        } else {
            const { data: urlData } = supabase.storage
                .from('imagenes-articulos')
                .getPublicUrl(path);
            setUploadedInlineImages(prev => [...prev, urlData.publicUrl]);
            const html = editor.getHTML().replace(localUrl, urlData.publicUrl);
            editor.commands.setContent(html);
        }`
);

// 4. Inline GC on Submit
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
  `    const handleSubmit = async (isDraft: boolean) => {
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
    };`
);

fs.writeFileSync(path, content, 'utf-8');
console.log("Patched successfully!");
