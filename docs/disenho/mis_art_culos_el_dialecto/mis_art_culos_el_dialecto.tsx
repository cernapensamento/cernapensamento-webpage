import React from 'react';

export default function MisArtCulosElDialecto() {
  return (
    <>

{/*  TopNavBar  */}
<nav className="bg-surface dark:bg-surface-container-low text-primary dark:text-primary-fixed font-label-md text-label-md tracking-widest w-full top-0 sticky border-b border-outline-variant dark:border-outline z-50 flex justify-between items-center px-margin-desktop h-16 w-full">
<div className="font-headline-md text-headline-md text-primary dark:text-primary-fixed">El Dialecto</div>
<div className="hidden md:flex gap-8 items-center">
<a className="text-on-surface-variant dark:text-on-primary-container hover:text-secondary dark:hover:text-secondary-container transition-colors cursor-pointer transition-all duration-300" href="#">Publicaciones</a>
<a className="text-on-surface-variant dark:text-on-primary-container hover:text-secondary dark:hover:text-secondary-container transition-colors cursor-pointer transition-all duration-300" href="#">Archivo</a>
</div>
<div className="flex items-center gap-6">
<span className="material-symbols-outlined cursor-pointer transition-all duration-300 hover:text-secondary">notifications</span>
<span className="material-symbols-outlined cursor-pointer transition-all duration-300 hover:text-secondary">settings</span>
<div className="w-8 h-8 overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional, high-contrast portrait of a writer in a minimalist studio. The lighting is soft and directed, highlighting the intellectual and contemplative mood. The aesthetic uses deep shadows and crisp ivory highlights to match the refined minimalist design system of a philosophical journal." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYARUlxYv58yCwIgcxbdma5iymHm-pVB2QO04XGcSGqPpqz7bzYCb-uNoLMK9qxOXb71lsQGWLj2SlJkyiKwt09Z4c1WbZwpnMs1GDvm9vijVpbiY21sRN-9PXiloNgCRCUKIwNAeejDTrcFHzK8KxwABLygLbvBZYYh9dJW40vbSauzOlKRDx-qj4ghCBhJ8I1bmFkwxoydTw_2AxC5ZzVHf-L2jZ7HJTrtQwIApaWx3rFj3tZyCGq1nqPBBnYB2_LIGx0uLXKV4"/>
</div>
</div>
</nav>
{/*  SideNavBar  */}
<aside className="hidden md:flex bg-surface dark:bg-surface-container-low text-secondary dark:text-secondary-fixed font-label-md text-label-md uppercase tracking-wider h-screen w-64 fixed left-0 top-16 border-r border-outline-variant dark:border-outline flex flex-col h-full py-8 z-40">
<div className="px-8 mb-8">
<h2 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed mb-1">Escritorio</h2>
<p className="text-[10px] text-on-surface-variant font-normal tracking-widest">Panel de Control</p>
</div>
<nav className="flex-grow space-y-2">
<a className="flex items-center gap-4 px-8 py-4 text-primary dark:text-primary-fixed border-l-4 border-secondary bg-surface-container-low dark:bg-tertiary-container scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">description</span>
<span>Mis Artículos</span>
</a>
<a className="flex items-center gap-4 px-8 py-4 text-on-surface-variant dark:text-on-primary-container hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">edit_note</span>
<span>Nuevo Artículo</span>
</a>
<a className="flex items-center gap-4 px-8 py-4 text-on-surface-variant dark:text-on-primary-container hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">query_stats</span>
<span>Estadísticas</span>
</a>
<a className="flex items-center gap-4 px-8 py-4 text-on-surface-variant dark:text-on-primary-container hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">person</span>
<span>Perfil</span>
</a>
</nav>
<div className="px-8 mb-12">
<button className="w-full py-3 bg-primary text-on-primary font-label-md uppercase tracking-widest text-center hover:bg-secondary transition-colors duration-300">
                Publicar ahora
            </button>
</div>
<div className="px-8 mt-auto border-t border-outline-variant py-6">
<a className="flex items-center gap-4 text-on-surface-variant hover:text-error transition-colors" href="#">
<span className="material-symbols-outlined">logout</span>
<span className="text-label-md uppercase tracking-wider">Cerrar Sesión</span>
</a>
</div>
</aside>
{/*  Main Content Canvas  */}
<main className="md:ml-64 p-margin-mobile md:p-margin-desktop min-h-screen">
<div className="max-w-container-max mx-auto pt-8">
{/*  Header Section  */}
<header className="mb-12">
<h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-4">Mis Artículos</h1>
<p className="text-on-surface-variant max-w-2xl font-body-lg">Gestione su producción intelectual. Revise borradores, analice el impacto de sus publicaciones o archive investigaciones concluidas.</p>
</header>
{/*  Filter & Controls  */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-outline-variant pb-6">
<div className="flex flex-wrap gap-8">
<div className="flex flex-col gap-2">
<label className="font-label-sm uppercase text-on-surface-variant">Estado</label>
<select className="bg-transparent border-0 border-b border-outline focus:ring-0 focus:border-secondary font-label-md py-1 pl-0 pr-8 cursor-pointer">
<option>Todos los estados</option>
<option>Publicado</option>
<option>Borrador</option>
<option>Archivado</option>
</select>
</div>
<div className="flex flex-col gap-2">
<label className="font-label-sm uppercase text-on-surface-variant">Fecha de creación</label>
<input className="bg-transparent border-0 border-b border-outline focus:ring-0 focus:border-secondary font-label-md py-1 px-0 cursor-pointer" type="date"/>
</div>
</div>
<div className="flex items-center gap-4 w-full md:w-auto">
<div className="relative w-full md:w-64">
<input className="w-full bg-transparent border-0 border-b border-outline focus:ring-0 focus:border-secondary font-body-md py-1 pl-0 pr-8" placeholder="Buscar título..." type="text"/>
<span className="material-symbols-outlined absolute right-0 bottom-2 text-on-surface-variant">search</span>
</div>
</div>
</div>
{/*  Detailed List (Asymmetric Grid Layout)  */}
<div className="space-y-12 mb-section-gap">
{/*  Article Item 1 (Published)  */}
<article className="group relative flex flex-col md:flex-row gap-8 items-start pb-12 border-b border-outline-variant hover:border-secondary transition-colors duration-500">
<div className="w-full md:w-1/4 aspect-[4/3] bg-surface-container-low overflow-hidden">
<img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" data-alt="A minimalist architectural shot of a brutalist library. The building is made of raw grey concrete with sharp, geometric lines. The lighting is cold and atmospheric, creating deep shadows. The overall aesthetic is intellectual, rigid, and sophisticated, matching a philosophical journal's visual identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDauTI_XWJOtAITaDM3NUvD8gJx7_SE6yCIqj4uFlZwmvruKrprfVK8hrOAu6-NHUTyqhTWVGtdLWEon-FKtZhQCFa-vqpeGv0mbc2V3h1pxhK1rv5S3UxqiScpZJ42Bjr1mH-RftApLvkaezmk6OBBBI8a81MN_ZNJgzDdghA0q25zJFUdqd0RwM7tL7eYUhIqudzM1PgkzsLiYskix6KvBlIEcj_C9iGrTmZsmCdk-G9gSpCWUqYq1zJtBlybSfy5bGfIgaP2At0"/>
</div>
<div className="flex-grow flex flex-col justify-between h-full py-2">
<div>
<div className="flex items-center gap-4 mb-3">
<span className="font-label-sm uppercase tracking-widest text-secondary">Publicado</span>
<span className="font-label-sm text-on-surface-variant">14 May 2024</span>
</div>
<h3 className="font-headline-sm text-headline-sm mb-4 group-hover:text-secondary transition-colors cursor-pointer">La Ontología de lo Invisible en la Era Digital</h3>
<p className="text-on-surface-variant line-clamp-2 max-w-2xl font-body-md mb-6">Un análisis profundo sobre cómo la mediación tecnológica altera nuestra percepción del ser y la presencia física en los espacios comunes contemporáneos.</p>
</div>
<div className="flex flex-wrap gap-6 mt-auto">
<button className="flex items-center gap-2 font-label-md uppercase tracking-wider text-primary hover:text-secondary transition-colors">
<span className="material-symbols-outlined text-sm">edit</span> Editar
                            </button>
<button className="flex items-center gap-2 font-label-md uppercase tracking-wider text-primary hover:text-secondary transition-colors">
<span className="material-symbols-outlined text-sm">visibility</span> Previsualizar
                            </button>
<button className="flex items-center gap-2 font-label-md uppercase tracking-wider text-primary hover:text-secondary transition-colors">
<span className="material-symbols-outlined text-sm">bar_chart</span> Estadísticas
                            </button>
</div>
</div>
<div className="hidden lg:flex flex-col items-end gap-1 min-w-[120px]">
<span className="text-headline-sm font-light">12.4k</span>
<span className="font-label-sm uppercase text-on-surface-variant">Lecturas</span>
</div>
</article>
{/*  Article Item 2 (Draft)  */}
<article className="group relative flex flex-col md:flex-row gap-8 items-start pb-12 border-b border-outline-variant hover:border-secondary transition-colors duration-500">
<div className="w-full md:w-1/4 aspect-[4/3] bg-surface-container-low overflow-hidden">
<img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" data-alt="Close-up of an old, intricate typewriter on a wooden desk scattered with handwritten notes. The scene is illuminated by a single warm desk lamp, creating a cozy and focused workspace. The mood is nostalgic, scholarly, and timeless, consistent with a high-end literary magazine's aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbx8spA7eW38hA9ozhPiPlPK3pGD4tf6dfNrPBAtQ5pQuDrsZ96m6fKrsN0IEJr2MKCH997gFXZZzUx7KY3cppR7P49si4S_MLlFdgpsar6BIa8gbgNTxElq7ZNeVnyN7f5OGpaur_owysuwNJCViOAd5lD4GUIn-Jo1VmJ3ArUGvJPkIctBqxBdhcgaYRo0kWTp9uIO2-JkJPEmRSqK4loAPY6UK1Xv6WZtyC6dLG8IZjIz0mx3AWwLMaPPX32xZbH8exaIu44lg"/>
</div>
<div className="flex-grow flex flex-col justify-between h-full py-2">
<div>
<div className="flex items-center gap-4 mb-3">
<span className="font-label-sm uppercase tracking-widest text-on-surface-variant bg-surface-container-high px-2 py-0.5">Borrador</span>
<span className="font-label-sm text-on-surface-variant">22 Jun 2024</span>
</div>
<h3 className="font-headline-sm text-headline-sm mb-4 group-hover:text-secondary transition-colors cursor-pointer">Dialéctica del Consumo: De Hegel a TikTok</h3>
<p className="text-on-surface-variant line-clamp-2 max-w-2xl font-body-md mb-6">Investigando las raíces fenomenológicas del deseo mimético en las interfaces de desplazamiento infinito y la disolución del sujeto.</p>
</div>
<div className="flex flex-wrap gap-6 mt-auto">
<button className="flex items-center gap-2 font-label-md uppercase tracking-wider text-primary hover:text-secondary transition-colors">
<span className="material-symbols-outlined text-sm">edit</span> Editar
                            </button>
<button className="flex items-center gap-2 font-label-md uppercase tracking-wider text-primary hover:text-secondary transition-colors">
<span className="material-symbols-outlined text-sm">visibility</span> Previsualizar
                            </button>
<button className="flex items-center gap-2 font-label-md uppercase tracking-wider text-on-surface-variant opacity-50 cursor-not-allowed">
<span className="material-symbols-outlined text-sm">bar_chart</span> Estadísticas
                            </button>
</div>
</div>
</article>
{/*  Article Item 3 (Archived)  */}
<article className="group relative flex flex-col md:flex-row gap-8 items-start pb-12 border-b border-outline-variant hover:border-secondary transition-colors duration-500">
<div className="w-full md:w-1/4 aspect-[4/3] bg-surface-container-low overflow-hidden">
<img className="w-full h-full object-cover grayscale transition-all duration-700" data-alt="A wide, minimalist landscape of a foggy lake at dawn. A single small rowboat is tied to a simple wooden pier. The colors are muted greys, blues, and ivory. The lighting is ethereal and flat, evoking a sense of calm, finality, and philosophical reflection. Perfect for a refined journal layout." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb-tL3lBKiCJyGFW9valqVfX8HeeuWM2DqxDvBo-RIUgfUz9sUqmDWZB8v3igHJ1qUFA6tJxxXArblpgcTyE7v1PO10FjWtBrguXvciHHztXEqIgAZywhJf6RV-TmKNIo-1JdwKc88HZJHARWw55RXibrM7p0LiJ0BSbPI_TfRZqxBR5EOK6AflqaG6FlDjmEhIKZs_p4pV9q6YUrwjHrCwD7tbULHl4X1mnM11TAsQQjNNYZGK5FIjttCJoQ3N50czRcf1Oq-ppw"/>
</div>
<div className="flex-grow flex flex-col justify-between h-full py-2 opacity-60 hover:opacity-100 transition-opacity">
<div>
<div className="flex items-center gap-4 mb-3">
<span className="font-label-sm uppercase tracking-widest text-on-surface-variant">Archivado</span>
<span className="font-label-sm text-on-surface-variant">03 Ene 2024</span>
</div>
<h3 className="font-headline-sm text-headline-sm mb-4 group-hover:text-secondary transition-colors cursor-pointer">Economía de la Atención y el Silencio Voluntario</h3>
<p className="text-on-surface-variant line-clamp-2 max-w-2xl font-body-md mb-6">Una reflexión sobre la resistencia epistémica a través de la desconexión selectiva y la recuperación de los tiempos muertos del pensamiento.</p>
</div>
<div className="flex flex-wrap gap-6 mt-auto">
<button className="flex items-center gap-2 font-label-md uppercase tracking-wider text-primary hover:text-secondary transition-colors">
<span className="material-symbols-outlined text-sm">unarchive</span> Desarchivar
                            </button>
<button className="flex items-center gap-2 font-label-md uppercase tracking-wider text-primary hover:text-secondary transition-colors">
<span className="material-symbols-outlined text-sm">bar_chart</span> Estadísticas
                            </button>
</div>
</div>
<div className="hidden lg:flex flex-col items-end gap-1 min-w-[120px]">
<span className="text-headline-sm font-light">45.8k</span>
<span className="font-label-sm uppercase text-on-surface-variant">Lecturas</span>
</div>
</article>
</div>
</div>
</main>
{/*  Footer  */}
<footer className="bg-surface-container-lowest dark:bg-tertiary text-on-surface-variant dark:text-on-tertiary-container font-label-sm text-label-sm w-full py-12 border-t border-outline-variant dark:border-outline flex flex-col items-center justify-center gap-4 w-full">
<div className="font-headline-sm text-headline-sm text-primary mb-2">El Dialecto</div>
<div className="flex gap-8 mb-4">
<a className="text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors opacity-80 hover:opacity-100" href="#">Privacidad</a>
<a className="text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors opacity-80 hover:opacity-100" href="#">Términos</a>
<a className="text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors opacity-80 hover:opacity-100" href="#">Contacto</a>
</div>
<p className="opacity-80">© 2024 El Dialecto. Revista de Crítica y Filosofía.</p>
</footer>
<script>
        // Micro-interaction: Smooth hover effects on side nav items
        const sideNavLinks = document.querySelectorAll('aside a');
        sideNavLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.classList.add('translate-x-1');
            });
            link.addEventListener('mouseleave', () => {
                link.classList.remove('translate-x-1');
            });
        });

        // Filter logic simulation
        const filterSelect = document.querySelector('select');
        filterSelect.addEventListener('change', (e) => {
            console.log('Filtering articles by status:', e.target.value);
            // In a real app, this would trigger an API call or re-render
        });
    </script>

    </>
  );
}
