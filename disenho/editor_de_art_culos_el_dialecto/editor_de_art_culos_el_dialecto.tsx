import React from 'react';

export default function EditorDeArtCulosElDialecto() {
  return (
    <>

{/*  Top Navigation Bar  */}
<header className="w-full top-0 sticky z-50 bg-surface border-b border-outline-variant flex justify-between items-center px-margin-desktop h-16">
<div className="font-headline-md text-headline-md text-primary">El Dialecto</div>
<nav className="hidden md:flex gap-8 items-center">
<a className="font-label-md text-label-md tracking-widest text-on-surface-variant hover:text-secondary transition-colors uppercase" href="#">Publicaciones</a>
<a className="font-label-md text-label-md tracking-widest text-on-surface-variant hover:text-secondary transition-colors uppercase" href="#">Archivo</a>
</nav>
<div className="flex items-center gap-6">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all">notifications</button>
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all">settings</button>
<div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional close-up portrait of a literary editor in a sunlit minimalist study. The aesthetic is warm and scholarly, with soft ivory tones and deep charcoal accents in the background. The lighting is natural and diffuse, highlighting a clean, sophisticated atmosphere suitable for a high-end philosophical journal." src="https://lh3.googleusercontent.com/aida-public/AB6AXuABSg4q_dTCV0TZkdUeGDl7JzaC0mlTHJ9tcmhv85mDfaXA9zG9_ASCmK5eSpuuZM_O_FHEn3nRbThlGPqM2cuPK0JTzi8s9pnAv920LUKSANQZT07siSVIQUlGHxXXyj5uhftDtAsfzSB2QqS_mFukAAiCdg3sgwzzIifzuaGXeECII4klohaQ3BC-lPHDdxKXh9G2mEuhjpSEj46XOiXxtHV3fcEZzf9gZmeEoJivbmqtvXe3eII1gecGOec-LFaT9WP4Jf7AZpo"/>
</div>
</div>
</header>
<div className="flex h-[calc(100vh-64px)] overflow-hidden">
{/*  Side Navigation Bar (Desktop)  */}
<aside className="hidden lg:flex flex-col h-full w-64 py-8 border-r border-outline-variant bg-surface flex-shrink-0">
<div className="px-6 mb-8">
<h2 className="font-headline-sm text-headline-sm text-primary">Escritorio</h2>
<p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">Panel de Control</p>
</div>
<nav className="flex-grow">
<ul className="space-y-1">
<li>
<a className="flex items-center px-6 py-3 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high transition-colors group" href="#">
<span className="material-symbols-outlined mr-4 group-hover:text-secondary">description</span>
                            Mis Artículos
                        </a>
</li>
<li>
<a className="flex items-center px-6 py-3 font-label-md text-label-md uppercase tracking-wider text-primary border-l-4 border-secondary bg-surface-container-low transition-all" href="#">
<span className="material-symbols-outlined mr-4 text-secondary">edit_note</span>
                            Nuevo Artículo
                        </a>
</li>
<li>
<a className="flex items-center px-6 py-3 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high transition-colors group" href="#">
<span className="material-symbols-outlined mr-4 group-hover:text-secondary">query_stats</span>
                            Estadísticas
                        </a>
</li>
<li>
<a className="flex items-center px-6 py-3 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high transition-colors group" href="#">
<span className="material-symbols-outlined mr-4 group-hover:text-secondary">person</span>
                            Perfil
                        </a>
</li>
</ul>
</nav>
<div className="px-6 mt-auto">
<button className="w-full bg-primary text-on-primary py-3 font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-all mb-6">
                    Publicar ahora
                </button>
<a className="flex items-center font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-error transition-colors" href="#">
<span className="material-symbols-outlined mr-4">logout</span>
                    Cerrar Sesión
                </a>
</div>
</aside>
{/*  Main Content Canvas (Editor)  */}
<main className="flex-grow overflow-y-auto bg-surface-container-lowest">
{/*  Floating Toolbar  */}
<div className="sticky-toolbar sticky top-0 z-40 border-b border-outline-variant px-8 py-3 flex items-center justify-between">
<div className="flex items-center gap-1">
<button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high transition-colors" title="Negrita"><span className="material-symbols-outlined text-[20px]">format_bold</span></button>
<button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high transition-colors" title="Cursiva"><span className="material-symbols-outlined text-[20px]">format_italic</span></button>
<button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high transition-colors" title="Cita"><span className="material-symbols-outlined text-[20px]">format_quote</span></button>
<div className="h-6 w-[1px] bg-outline-variant mx-2"></div>
<button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high transition-colors" title="Imagen"><span className="material-symbols-outlined text-[20px]">image</span></button>
<button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high transition-colors" title="Enlace"><span className="material-symbols-outlined text-[20px]">link</span></button>
<button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high transition-colors" title="Lista"><span className="material-symbols-outlined text-[20px]">format_list_bulleted</span></button>
</div>
<div className="flex items-center gap-4">
<span className="text-label-sm font-label-sm text-on-surface-variant italic">Guardado automáticamente hace 2 min</span>
<button className="px-4 py-2 border border-primary font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container-low transition-all">Vista Previa</button>
</div>
</div>
{/*  Editor Area  */}
<div className="max-w-[800px] mx-auto py-24 px-8 editor-container">
<div className="space-y-12">
{/*  Category & Title  */}
<div className="space-y-6">
<input className="w-full border-none bg-transparent font-label-md text-label-md text-secondary tracking-[0.2em] uppercase focus:ring-0 placeholder:text-outline-variant" placeholder="CATEGORÍA (E.G. FILOSOFÍA, POLÍTICA)" type="text"/>
<textarea className="w-full border-none bg-transparent font-display-lg text-display-lg text-primary focus:ring-0 placeholder:text-outline-variant resize-none overflow-hidden" oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'" placeholder="El título de tu investigación..." rows={1}></textarea>
<textarea className="w-full border-none bg-transparent font-headline-sm text-headline-sm text-on-surface-variant italic focus:ring-0 placeholder:text-outline-variant resize-none overflow-hidden" oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'" placeholder="Un subtítulo o breve resumen que invite a la reflexión profunda..." rows={1}></textarea>
</div>
<div className="h-[1px] w-12 bg-secondary opacity-30"></div>
{/*  Body Content  */}
<div className="space-y-8">
<div className="w-full border-none bg-transparent font-body-lg text-body-lg text-on-surface focus:outline-none min-h-[400px] drop-cap" contenteditable="true" placeholder="Comienza a escribir tu ensayo aquí...">
                            La naturaleza del pensamiento contemporáneo exige una pausa deliberada, un alejamiento de la inmediatez digital que nos consume. En estas líneas, exploramos la intersección entre la ética clásica y el desorden algorítmico del siglo XXI...
                        </div>
</div>
</div>
</div>
</main>
{/*  Right Settings Sidebar  */}
<aside className="hidden xl:flex flex-col w-80 h-full border-l border-outline-variant bg-surface flex-shrink-0 overflow-y-auto p-8">
<h3 className="font-label-md text-label-md uppercase tracking-widest text-primary mb-8 pb-4 border-b border-outline-variant">Ajustes de Publicación</h3>
<div className="space-y-8">
{/*  Cover Image  */}
<div className="space-y-4">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Imagen de Portada</label>
<div className="relative aspect-video bg-surface-container-high border border-dashed border-outline hover:bg-surface-container-highest transition-colors cursor-pointer flex flex-col items-center justify-center group overflow-hidden">
<img className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" data-alt="A monochromatic architectural photograph of a spiral staircase in a modernist library. High contrast, sharp shadows, and elegant geometric lines create a sense of intellectual depth and structural integrity. The visual style is minimal and sophisticated, fitting for a prestigious philosophical publication's cover image." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBikfq6Lg8hza9PM5zO2xYJClve5fZp44rqWMjP8pDt5gvC6QS7CLzD6zgOPrqsiRcBvgxydSob4Ubt-dRBQYHIdWPysVHt8cdH-OjMW6kKEmcqqNQ5v4wfj0JskcNdhe63fnVYLOfYuPNRRfadpRg_5_pRotRPOngJ4fhszrJnWv3danu7gpZLaHD71fYL1LncxHMZUxz1C561USilETIbOiSgpLWPcCe4TtTvJiVwcv1tr4ghtTUMrr92p-5WJASeT2HqjT8LvRQ"/>
<div className="relative z-10 flex flex-col items-center">
<span className="material-symbols-outlined text-primary mb-2">add_a_photo</span>
<span className="font-label-sm text-label-sm text-on-surface">Cambiar imagen</span>
</div>
</div>
</div>
{/*  Tags  */}
<div className="space-y-4">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Etiquetas</label>
<div className="flex flex-wrap gap-2">
<span className="px-3 py-1 bg-surface-container-low border border-outline-variant text-label-sm font-label-sm flex items-center gap-2">
                            Metafísica <button className="material-symbols-outlined text-[14px]">close</button>
</span>
<span className="px-3 py-1 bg-surface-container-low border border-outline-variant text-label-sm font-label-sm flex items-center gap-2">
                            Ética <button className="material-symbols-outlined text-[14px]">close</button>
</span>
<button className="px-3 py-1 border border-dashed border-outline-variant text-label-sm font-label-sm hover:bg-surface-container-low transition-colors">+ Añadir</button>
</div>
</div>
{/*  Scheduling  */}
<div className="space-y-4">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Programación</label>
<div className="space-y-4">
<div className="flex items-center justify-between p-3 border-b border-outline-variant">
<span className="font-body-md text-on-surface">Fecha</span>
<span className="font-label-md text-secondary">24 Mayo, 2024</span>
</div>
<div className="flex items-center justify-between p-3 border-b border-outline-variant">
<span className="font-body-md text-on-surface">Hora</span>
<span className="font-label-md text-secondary">08:00 AM</span>
</div>
</div>
</div>
{/*  Visiblity  */}
<div className="space-y-4">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Visibilidad</label>
<select className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 font-body-md py-2 px-0">
<option>Público</option>
<option>Sólo suscriptores</option>
<option>Borrador privado</option>
</select>
</div>
{/*  SEO Snippet  */}
<div className="pt-8 mt-8 border-t border-outline-variant space-y-4">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Vista previa SEO</label>
<div className="p-4 bg-white border border-outline-variant shadow-sm rounded-sm">
<div className="text-[#1a0dab] text-lg leading-tight hover:underline cursor-pointer mb-1">La naturaleza del pensamiento contemporáneo - El Dialecto</div>
<div className="text-[#006621] text-sm mb-1 leading-tight">eldialecto.com › filosofia › pensamiento</div>
<div className="text-[#545454] text-xs leading-normal line-clamp-2">Una exploración profunda sobre la intersección entre la ética clásica y el desorden algorítmico en el siglo XXI...</div>
</div>
</div>
</div>
</aside>
</div>
{/*  Mobile Navigation (Bottom Bar)  */}
<footer className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center h-16 z-50">
<button className="flex flex-col items-center gap-1 text-on-surface-variant">
<span className="material-symbols-outlined">description</span>
<span className="text-[10px] uppercase font-label-sm">Lista</span>
</button>
<button className="flex flex-col items-center gap-1 text-primary">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 1"}}>edit_note</span>
<span className="text-[10px] uppercase font-label-sm">Editor</span>
</button>
<button className="flex flex-col items-center gap-1 text-on-surface-variant">
<span className="material-symbols-outlined">settings</span>
<span className="text-[10px] uppercase font-label-sm">Ajustes</span>
</button>
<button className="flex flex-col items-center gap-1 text-on-surface-variant">
<span className="material-symbols-outlined">publish</span>
<span className="text-[10px] uppercase font-label-sm">Publicar</span>
</button>
</footer>
<script>
        // Simple micro-interaction for the contenteditable area
        const editor = document.querySelector('[contenteditable="true"]');
        editor.addEventListener('focus', () => {
            if (editor.innerText.includes('Comienza a escribir')) {
                editor.innerText = '';
            }
        });

        // Floating label behavior for textareas
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(ta => {
            ta.addEventListener('input', () => {
                ta.style.height = 'auto';
                ta.style.height = ta.scrollHeight + 'px';
            });
        });

        // Simple button click effects
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mousedown', () => btn.classList.add('scale-95'));
            btn.addEventListener('mouseup', () => btn.classList.remove('scale-95'));
            btn.addEventListener('mouseleave', () => btn.classList.remove('scale-95'));
        });
    </script>

    </>
  );
}
