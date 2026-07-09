import React from 'react';

export default function EscritorioDelEscritorElDialecto() {
  return (
    <>

{/*  SideNavBar Shell  */}
<aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant z-50">
<div className="px-8 py-10 flex flex-col h-full">
<div className="mb-12">
<h1 className="font-headline-sm text-headline-sm text-primary">Escritorio</h1>
<p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-1">Panel de Control</p>
</div>
<nav className="flex-grow space-y-2">
{/*  Mis Artículos - Active State  */}
<a className="flex items-center gap-4 py-3 px-4 transition-all duration-300 text-primary border-l-4 border-secondary bg-surface-container-low scale-95 active:scale-100" href="#">
<span className="material-symbols-outlined" data-icon="description">description</span>
<span className="font-label-md text-label-md uppercase tracking-wider">Mis Artículos</span>
</a>
<a className="flex items-center gap-4 py-3 px-4 transition-all duration-300 text-on-surface-variant hover:bg-surface-container-high scale-95 active:scale-100" href="#">
<span className="material-symbols-outlined" data-icon="edit_note">edit_note</span>
<span className="font-label-md text-label-md uppercase tracking-wider">Nuevo Artículo</span>
</a>
<a className="flex items-center gap-4 py-3 px-4 transition-all duration-300 text-on-surface-variant hover:bg-surface-container-high scale-95 active:scale-100" href="#">
<span className="material-symbols-outlined" data-icon="query_stats">query_stats</span>
<span className="font-label-md text-label-md uppercase tracking-wider">Estadísticas</span>
</a>
<a className="flex items-center gap-4 py-3 px-4 transition-all duration-300 text-on-surface-variant hover:bg-surface-container-high scale-95 active:scale-100" href="#">
<span className="material-symbols-outlined" data-icon="person">person</span>
<span className="font-label-md text-label-md uppercase tracking-wider">Perfil</span>
</a>
</nav>
<div className="mt-auto pt-8 border-t border-outline-variant">
<button className="w-full bg-primary text-on-primary py-4 px-6 font-label-md text-label-md uppercase tracking-widest transition-all hover:bg-secondary mb-8">
                    Publicar ahora
                </button>
<a className="flex items-center gap-4 py-3 px-4 text-on-surface-variant hover:text-error transition-colors" href="#">
<span className="material-symbols-outlined" data-icon="logout">logout</span>
<span className="font-label-md text-label-md uppercase tracking-wider">Cerrar Sesión</span>
</a>
</div>
</div>
</aside>
{/*  Main Content Canvas  */}
<main className="flex-grow md:ml-64 bg-background px-margin-mobile md:px-margin-desktop pb-24">
{/*  TopNavBar Shell (Web & Mobile responsive)  */}
<header className="w-full top-0 sticky bg-surface flex justify-between items-center h-16 z-40 border-b border-outline-variant">
<div className="flex items-center gap-8">
<span className="font-headline-md text-headline-md text-primary">El Dialecto</span>
<nav className="hidden md:flex gap-6">
<a className="font-label-md text-label-md tracking-widest text-on-surface-variant hover:text-secondary transition-colors" href="#">Publicaciones</a>
<a className="font-label-md text-label-md tracking-widest text-on-surface-variant hover:text-secondary transition-colors" href="#">Archivo</a>
</nav>
</div>
<div className="flex items-center gap-6">
<div className="hidden lg:flex items-center border-b border-outline px-2 py-1">
<span className="material-symbols-outlined text-on-surface-variant text-sm" data-icon="search">search</span>
<input className="bg-transparent border-none focus:ring-0 font-label-md text-label-md placeholder-on-surface-variant/50 w-48" placeholder="Buscar..." type="text"/>
</div>
<div className="flex items-center gap-4">
<button className="material-symbols-outlined text-primary hover:text-secondary transition-colors" data-icon="notifications">notifications</button>
<button className="material-symbols-outlined text-primary hover:text-secondary transition-colors" data-icon="settings">settings</button>
<div className="w-8 h-8 bg-surface-container-high border border-outline-variant overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional portrait of a refined academic writer in a minimalist office setting. The lighting is soft and natural, coming from a large window. The photographer uses a shallow depth of field to keep the focus on the subject's thoughtful expression. The overall aesthetic is clean, ivory-toned, and intellectually focused, matching a high-end literary journal brand." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7MT8I4iJi9oaz-ksmXZBKh9UdGvkYVLwMQvSpWs9EQyAD8rZf5DufwmVGUQ5uCG5uahsc3uQgS1NtkA2gUlzCzM7sV8vRDKudibLkyTvoGh1hXKukQlbHvz8mlI21pcRFpkITr6vDRvATOaMXiOWIjlRId-wF2QY98BuCyIww8u67nQ1epKY5YVHh5lKLG26uRN5MnrdT-bNEmArWHpN5lzEK3JphmVfYgfMY116r44VV8L5wZXCaLFuLjZKXaYL3WSpniDP-8V0"/>
</div>
</div>
</div>
</header>
{/*  Page Header Section  */}
<section className="mt-16 mb-section-gap">
<div className="max-w-container-max mx-auto">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
<div>
<h2 className="font-display-lg text-display-lg mb-4">Bienvenido, Editor.</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                            Sus últimas reflexiones sobre la ética del capital han generado una conversación significativa. Aquí tiene el estado actual de su obra.
                        </p>
</div>
<button className="flex items-center gap-3 bg-primary text-on-primary px-8 py-5 font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors shrink-0 group">
<span className="material-symbols-outlined transition-transform group-hover:rotate-90" data-icon="add">add</span>
                        Crear nueva publicación
                    </button>
</div>
</div>
</section>
{/*  Stats Overview Grid  */}
<section className="mb-section-gap">
<div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-gutter">
{/*  Stat Card 1  */}
<div className="border border-outline-variant p-10 bg-surface-container-lowest transition-colors hover:border-secondary group">
<p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-6 group-hover:text-secondary">Vistas Totales</p>
<div className="flex items-baseline gap-4">
<span className="font-display-lg text-display-lg">12.4k</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">+12%</span>
</div>
<div className="mt-8 h-1 bg-surface-container-high overflow-hidden">
<div className="h-full bg-secondary w-2/3"></div>
</div>
</div>
{/*  Stat Card 2  */}
<div className="border border-outline-variant p-10 bg-surface-container-lowest transition-colors hover:border-secondary group">
<p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-6 group-hover:text-secondary">Tiempo de Lectura Promedio</p>
<div className="flex items-baseline gap-4">
<span className="font-display-lg text-display-lg">8:42</span>
<span className="font-label-sm text-label-sm text-on-surface-variant italic">minutos</span>
</div>
<div className="mt-8 h-1 bg-surface-container-high overflow-hidden">
<div className="h-full bg-primary w-4/5"></div>
</div>
</div>
{/*  Stat Card 3  */}
<div className="border border-outline-variant p-10 bg-surface-container-lowest transition-colors hover:border-secondary group">
<p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-6 group-hover:text-secondary">Suscripciones Recientes</p>
<div className="flex items-baseline gap-4">
<span className="font-display-lg text-display-lg">452</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">+5%</span>
</div>
<div className="mt-8 h-1 bg-surface-container-high overflow-hidden">
<div className="h-full bg-secondary w-1/2"></div>
</div>
</div>
</div>
</section>
{/*  Article Lists Section (Bento Inspired)  */}
<section className="max-w-container-max mx-auto">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
{/*  Recent Publications Column  */}
<div className="lg:col-span-7">
<div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant">
<h3 className="font-headline-sm text-headline-sm">Publicaciones Recientes</h3>
<a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary uppercase tracking-widest underline decoration-1" href="#">Ver todo</a>
</div>
<div className="space-y-12">
{/*  Published Article 1  */}
<article className="group">
<div className="flex gap-8">
<div className="hidden sm:block w-32 h-32 shrink-0 border border-outline-variant overflow-hidden">
<img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" data-alt="A minimalist architectural photograph of a spiral concrete staircase in a modern museum. The lighting is dramatic, casting deep shadows and highlights that emphasize the geometric purity of the form. The overall palette is a spectrum of grays and creams, reflecting a sense of intellectual depth and architectural rigor suited for a philosophical journal." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuwVt1aluKDRerXIV2tSZxDSsIp9BtStKoXCs5Q9zpp5pRrumQK8Rx3yMA0C2ypHuKUXZnIA-Yrk7sacZlgtVed46yOSa0PV8th-HGKN-I0s9lC0koiyWmgtU7WimUjGH2v82wT2fpnCKK0md6sRuccFBYIGuYrjZiO1dnRyBsQXCI88gkJdklT3qybBwBa214j9MsMyhA_fM5VGlRc6XM8NYsZWjhrKAv2VAWkZSX-WOZhy-9cBYiD_6A7hlj6bYE0ZVOQZMFKQc"/>
</div>
<div className="flex-grow">
<div className="flex items-center gap-4 mb-2">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Filosofía</span>
<span className="w-1 h-1 bg-outline-variant rounded-full"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant">12 Oct 2024</span>
</div>
<h4 className="font-headline-sm text-headline-sm mb-3 group-hover:text-secondary transition-colors cursor-pointer">La Fenomenología de lo Digital: Un Análisis Crítico</h4>
<p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">Una exploración sobre cómo la interfaz de usuario altera nuestra percepción del ser y la presencia en el siglo XXI.</p>
<div className="mt-4 flex items-center gap-6">
<div className="flex items-center gap-1 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="visibility">visibility</span>
<span className="font-label-sm text-label-sm">3.4k</span>
</div>
<div className="flex items-center gap-1 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="forum">forum</span>
<span className="font-label-sm text-label-sm">24</span>
</div>
</div>
</div>
</div>
</article>
{/*  Published Article 2  */}
<article className="group">
<div className="flex gap-8">
<div className="hidden sm:block w-32 h-32 shrink-0 border border-outline-variant overflow-hidden">
<img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" data-alt="Close-up of a vintage fountain pen resting on a stack of high-quality parchment paper with elegant handwritten ink. The lighting is warm and golden, evoking a classic, timeless writing environment. The composition is focused and intimate, emphasizing the craft of traditional intellectual discourse in a modern digital world." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmrhB_bO2BSvK1CjutvM9qhtWHrCwvfYiZpNyREhVULZ5ZuH9MS0ocX5K-zIIK_ByLzex-w8awUgfRyls5AIi91rcZsockuE1J0ftTAnhvFgMzbsOD5xGcPuGJyaBfe2w4QY1hWpb6kV39Uu37PxIXkmoyyry6l9N5mRznZPBx4ItsPPgzmmY7EVR11qDrh91_vAGCwwNJ1fXJpK8LfJICcvK7tHJ8KXvDytE1tTwNtiv6X2mOc-ghqHyqStLveqCFQtUKZBmrhf8"/>
</div>
<div className="flex-grow">
<div className="flex items-center gap-4 mb-2">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Economía</span>
<span className="w-1 h-1 bg-outline-variant rounded-full"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant">05 Oct 2024</span>
</div>
<h4 className="font-headline-sm text-headline-sm mb-3 group-hover:text-secondary transition-colors cursor-pointer">El Valor de la Escasez en la Era de la Abundancia</h4>
<p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">Revisitando los principios de Smith y Marx bajo la lente de los activos digitales y la propiedad algorítmica.</p>
<div className="mt-4 flex items-center gap-6">
<div className="flex items-center gap-1 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="visibility">visibility</span>
<span className="font-label-sm text-label-sm">2.1k</span>
</div>
<div className="flex items-center gap-1 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="forum">forum</span>
<span className="font-label-sm text-label-sm">18</span>
</div>
</div>
</div>
</div>
</article>
</div>
</div>
{/*  Drafts and Activity Column  */}
<div className="lg:col-span-5 flex flex-col gap-gutter">
{/*  Drafts List  */}
<div className="border border-outline-variant p-8 bg-surface-container-low">
<h3 className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant mb-8 border-b border-outline-variant pb-4">Borradores en curso</h3>
<div className="space-y-6">
<div className="group cursor-pointer">
<h5 className="font-body-lg text-body-lg font-bold group-hover:text-secondary transition-colors">La Estética del Silencio</h5>
<div className="flex items-center justify-between mt-2">
<span className="font-label-sm text-label-sm text-on-surface-variant italic">Editado hace 2 horas</span>
<span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity" data-icon="edit">edit</span>
</div>
</div>
<div className="group cursor-pointer">
<h5 className="font-body-lg text-body-lg font-bold group-hover:text-secondary transition-colors">Fragmentos de una Realidad Aumentada</h5>
<div className="flex items-center justify-between mt-2">
<span className="font-label-sm text-label-sm text-on-surface-variant italic">Editado hace 3 días</span>
<span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity" data-icon="edit">edit</span>
</div>
</div>
</div>
<button className="mt-10 w-full border border-primary py-3 font-label-md text-label-md uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all">
                            Ver todos los borradores
                        </button>
</div>
{/*  Atmospheric Quote Box  */}
<div className="bg-primary p-12 text-on-primary relative overflow-hidden flex flex-col justify-center">

<div className="relative z-10 text-center">
<span className="material-symbols-outlined text-4xl mb-6 text-secondary" data-icon="format_quote">format_quote</span>
<p className="font-headline-sm text-headline-sm italic mb-8">"La escritura es la pintura de la voz."</p>
<cite className="font-label-md text-label-md uppercase tracking-[0.3em] text-on-primary-container">— Voltaire</cite>
</div>
</div>
</div>
</div>
</section>
{/*  Footer Shell  */}
<footer className="mt-section-gap flex flex-col items-center justify-center gap-4 w-full py-12 border-t border-outline-variant">
<span className="font-headline-sm text-headline-sm text-primary">El Dialecto</span>
<p className="font-label-sm text-label-sm text-on-surface-variant">© 2024 El Dialecto. Revista de Crítica y Filosofía.</p>
<div className="flex gap-6 mt-4">
<a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Privacidad</a>
<a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Términos</a>
<a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Contacto</a>
</div>
</footer>
</main>
{/*  Mobile Navigation Bar Shell  */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface flex items-center justify-around z-50 border-t border-outline-variant">
<a className="flex flex-col items-center text-primary" href="#">
<span className="material-symbols-outlined" data-icon="description">description</span>
<span className="text-[10px] uppercase font-bold">Escritorio</span>
</a>
<a className="flex flex-col items-center text-on-surface-variant" href="#">
<span className="material-symbols-outlined" data-icon="edit_note">edit_note</span>
<span className="text-[10px] uppercase">Nuevo</span>
</a>
<a className="flex flex-col items-center text-on-surface-variant" href="#">
<span className="material-symbols-outlined" data-icon="query_stats">query_stats</span>
<span className="text-[10px] uppercase">Stats</span>
</a>
<a className="flex flex-col items-center text-on-surface-variant" href="#">
<span className="material-symbols-outlined" data-icon="person">person</span>
<span className="text-[10px] uppercase">Perfil</span>
</a>
</nav>
<script>
        // Micro-interactions and subtle state changes
        document.querySelectorAll('article').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.transition = 'transform 0.3s ease';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });

        // Hover effect for nav items
        const navItems = document.querySelectorAll('aside nav a');
        navItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                if (!item.classList.contains('bg-surface-container-low')) {
                    item.style.paddingLeft = '1.5rem';
                }
            });
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('bg-surface-container-low')) {
                    item.style.paddingLeft = '1rem';
                }
            });
        });
    </script>

    </>
  );
}
