const fs = require('fs');

// 1. ArticleEditor.tsx
let editor = fs.readFileSync('src/components/escritorio/ArticleEditor.tsx', 'utf8');
if (!editor.includes('idioma_original?: string;')) {
    editor = editor.replace('fijado?: boolean;\n}', 'fijado?: boolean;\n    idioma_original?: string;\n}');
}
if (!editor.includes('const [idiomaOriginal')) {
    editor = editor.replace('const [isTranslating, setIsTranslating] = useState(false);', 'const [isTranslating, setIsTranslating] = useState(false);\n    const [idiomaOriginal, setIdiomaOriginal] = useState(initialData?.idioma_original || "gl");');
}
if (!editor.includes('idioma_original: idiomaOriginal')) {
    editor = editor.replace('tipo: tipo,\n        }, isDraft);', 'tipo: tipo,\n            idioma_original: idiomaOriginal,\n        }, isDraft);');
}
if (!editor.includes('value={idiomaOriginal}')) {
    const dropdownHtml = `
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
`;
    editor = editor.replace('</select>\n                                </div>', '</select>\n' + dropdownHtml + '                                </div>');
    // also fix the flex container
    editor = editor.replace('<div className="mb-4">', '<div className="mb-4 flex flex-wrap gap-4">');
}
fs.writeFileSync('src/components/escritorio/ArticleEditor.tsx', editor);

// 2. nuevo/page.tsx
let nuevo = fs.readFileSync('src/app/[lang]/escritorio/nuevo/page.tsx', 'utf8');
if (!nuevo.includes('idioma_original: data.idioma_original')) {
    nuevo = nuevo.replace("tipo: data.tipo || 'artigo'", "tipo: data.tipo || 'artigo',\n                idioma_original: data.idioma_original || 'gl'");
}
fs.writeFileSync('src/app/[lang]/escritorio/nuevo/page.tsx', nuevo);

// 3. EditarArticuloForm.tsx
let editar = fs.readFileSync('src/components/forms/EditarArticuloForm.tsx', 'utf8');
if (!editar.includes('idioma_original: articulo.idioma_original')) {
    editar = editar.replace("tipo: articulo.tipo || 'artigo'", "tipo: articulo.tipo || 'artigo',\n        idioma_original: articulo.idioma_original || 'gl'");
}
if (!editar.includes('idioma_original: data.idioma_original')) {
    editar = editar.replace("tipo: data.tipo || 'artigo'\n                })", "tipo: data.tipo || 'artigo',\n                    idioma_original: data.idioma_original || 'gl'\n                })");
}
fs.writeFileSync('src/components/forms/EditarArticuloForm.tsx', editar);

// 4. articulo/[slug]/page.tsx
let page = fs.readFileSync('src/app/[lang]/articulo/[slug]/page.tsx', 'utf8');
if (!page.includes('articulo.idioma_original !== lang')) {
    const originalText = `
          <div className="flex flex-col items-center justify-center gap-3 mt-10">
            <div className="flex items-center justify-center gap-4 text-sm font-semibold text-charcoal/70">
              <span className="text-charcoal border-b border-lines pb-1 uppercase tracking-widest">
                {articulo.perfiles?.nombre || 'Autor Desconocido'}
              </span>
              <span className="font-serif text-lines">—</span>
              <time className="uppercase tracking-widest">{fecha}</time>
            </div>
            {articulo.idioma_original && articulo.idioma_original !== lang && (
              <div className="text-[10px] text-charcoal/60 uppercase tracking-[0.15em]">
                {lang === 'es' ? 'Idioma original:' : 'Idioma orixinal:'}{' '}
                <Link href={\`/\${articulo.idioma_original}/articulo/\${articulo.slug || slug}\`} className="text-gold font-bold hover:underline transition-all">
                  {articulo.idioma_original.toUpperCase()}
                </Link>
              </div>
            )}
          </div>
`;
    // Replace the old div
    page = page.replace(/<div className="flex items-center justify-center gap-4 text-sm font-semibold text-charcoal\/70 mt-10">[\s\S]*?<\/time>\n\s*<\/div>/, originalText);
}
fs.writeFileSync('src/app/[lang]/articulo/[slug]/page.tsx', page);
