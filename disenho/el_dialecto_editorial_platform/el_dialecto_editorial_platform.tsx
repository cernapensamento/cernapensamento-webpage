import React from 'react';

export default function ElDialectoEditorialPlatform() {
  return (
    <>

{/*  TopNavBar  */}
<nav className="bg-background border-b border-outline-variant w-full px-margin-mobile md:px-margin-desktop py-4 sticky top-0 z-50">
<div className="flex justify-between items-center w-full max-w-container-max mx-auto relative h-[42px]">
<div className="hidden md:flex gap-6 items-center w-24"></div>
{/*  Brand Logo  */}
<a className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tighter absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" href="#">El Dialecto</a>
{/*  Trailing Action  */}
<div className="flex items-center gap-4 ml-auto">
<button className="text-primary hover:text-secondary transition-colors duration-300">
<span className="material-symbols-outlined text-[24px]">search</span>
</button>
<button className="font-label-md text-label-md text-on-primary bg-primary px-4 py-2 hover:bg-surface-tint transition-colors duration-300 uppercase tracking-wider">
                    Suscribirse
                </button>
</div>
</div>
</nav>
{/*  Main Content Canvas  */}
<main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-12 pb-section-gap flex flex-col gap-section-gap">
{/*  Hero Section: Featured Article  */}
<section className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
<div className="md:col-span-7 h-[400px] md:h-[600px] relative w-full overflow-hidden">
<img alt="Featured Article Image" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-in-out cursor-pointer" data-alt="A striking, high-contrast monochrome photograph of an empty, brutalist concrete hallway leading towards a starkly lit doorway. Deep shadows and bright highlights evoke a sense of isolation and philosophical introspection, aligning with a refined, intellectual editorial style. Black and white, highly detailed." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7FADb8L81KTsimkAtTv_ZHrmPpnz2ihXFsZRjHHLRDWD_brbO0B2kqn5fLW4t-ub_WvKvOg81TOaH4XVkJ-VTH3Y0wB6YtelzQwpH4brNLVfPNHoDkKorsyoEtdeDDUrc0N5DgE1rcca9hpAgWjO-PYdi5-Lt799e7-BGZSVEPHg-PFvaiBFXuCTAkfMvQDI64Tb6WrBjF6Gv7STD1U2Ue3ogU14aH9szSbmmytcEnTkqPBbnocNuu7TTaUrrPlG0RX0Jwv4a_xw" />
</div>
<div className="md:col-span-5 flex flex-col gap-6 pt-6 md:pt-0">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest">Filosofía • Destacado</span>
<h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary cursor-pointer hover:text-secondary transition-colors duration-300">
                    La Arquitectura del Silencio: Encontrando Significado en el Vacío
                </h1>
<p className="font-body-md text-body-md text-on-surface-variant">
                    Una exploración sobre cómo los espacios modernos construyen la ausencia de sonido, y si el verdadero silencio es una realidad objetiva o una proyección psicológica dentro de la sociedad contemporánea.
                </p>
<div className="pt-4 border-t border-outline-variant w-1/4 mt-2">
<span className="font-label-md text-label-md text-on-surface">Por Eleanor Vance</span>
</div>
</div>
</section>
{/*  Writers' Columns  */}
<section className="border-t border-outline-variant pt-12">
<h2 className="font-headline-sm text-headline-sm text-primary mb-8 text-center uppercase tracking-widest">Los Columnistas</h2>
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter">
{/*  Writer 1  */}
<div className="flex flex-col items-center text-center group cursor-pointer"><div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-outline-variant p-1">
<img alt="Writer Portrait" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkClvumTzIc_-8sSE9y5Prw8uuOJBmNv_yyDQ_7NLkq1ObD2QMso-8sE4pfp0QNU6xQcCkICnkiV6cFzOj5SFeWTzyPu-qOvbBFjIT5cRPz_fIsdVRsyxEGvp0YKwwDVfBu7qKMvTsuPz1R209PA5bQyzYYcfVafaKWfOkXPdskEmbIZoJk6aIZITnPURxPijtCpaZpkE8ONe1ckJ6z48UZgnq6bxfzzJ3_ZAoHEw09yMNagwgdjU0gYfekmO5OWbYr2XvofAToow" />
</div>
<span className="font-label-md text-label-md text-primary uppercase tracking-widest mb-1">Alistair Sterling</span>
<h3 className="font-headline-md text-[20px] leading-[28px] text-on-surface-variant group-hover:text-secondary transition-colors duration-300">La Economía de la Escasez</h3>
<div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-700 ease-in-out">
<p className="font-label-sm text-secondary uppercase tracking-widest mt-2">Economista Senior</p>
<p className="font-body-md text-sm text-on-surface-variant mt-2 px-4">Analista de sistemas macroeconómicos y sostenibilidad global.</p>
<div className="flex gap-4 mt-4 justify-center text-on-surface-variant">
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">mail</span></a>
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">share</span></a>
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">person</span></a>
</div>
</div></div>
{/*  Writer 2  */}
<div className="flex flex-col items-center text-center group cursor-pointer"><div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-outline-variant p-1">
<img alt="Writer Portrait" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9q1SN42Xj49Bi2NNrzPGThG86CgN_YoNOFhhl7RvRV3as2Ya6dCJhnf1tXvxUHYLE1ivmvL4SWWZy1BLI-kUEi-8o8-a5PvuxklMTpYm9L3XNaGOhOM1BR-J6Nw6LvOB0Ld6UpMvaq6su6mXK1ujYCTftHDUuJQkhMlRDoRxxDNhq3oAxlpCHS8w73dUdR5ydO5WGLoeEXoJD_bVD3p1GnSZ1YaGsqz7k22iWNnr4viD1c23qULM2QNWZVO3Rc3PmOjrATLJPLYo" />
</div>
<span className="font-label-md text-label-md text-primary uppercase tracking-widest mb-1">Miriam Rothschild</span>
<h3 className="font-headline-md text-[20px] leading-[28px] text-on-surface-variant group-hover:text-secondary transition-colors duration-300">Ficciones Políticas</h3>
<div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-700 ease-in-out">
<p className="font-label-sm text-secondary uppercase tracking-widest mt-2">Politóloga y Ensayista</p>
<p className="font-body-md text-sm text-on-surface-variant mt-2 px-4">Explorando la intersección entre el poder, la narrativa y la identidad colectiva.</p>
<div className="flex gap-4 mt-4 justify-center text-on-surface-variant">
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">mail</span></a>
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">share</span></a>
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">person</span></a>
</div>
</div></div>
{/*  Writer 3  */}
<div className="flex flex-col items-center text-center group cursor-pointer"><div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-outline-variant p-1">
<img alt="Writer Portrait" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvayGb6MF_1nAC_2JGeY5aazkKg9xtpVLr_VAYRCRHJ4IGnhQsnY80WUwgk1afGTxcQoMrY04sxM6F7Db9Y-J2LnwHGHArEYYFhVsK_T3_7jjF4qXNFIiDyfh-B4khnKHB1ltW7Ip1vccPKyZmbIJn4P-DIazF1V4Yda23biPiPZpMiHf3wZs0RdGrw-yjohb96oaMCnYAdJHLq6ZcFeN8hRdqXLcLn8isU77dvkMYg-s-_Y-zfltWuX6O_YgTCYmcV25iG21tHD8" />
</div>
<span className="font-label-md text-label-md text-primary uppercase tracking-widest mb-1">Julian Thorne</span>
<h3 className="font-headline-md text-[20px] leading-[28px] text-on-surface-variant group-hover:text-secondary transition-colors duration-300">Notas sobre lo Vernáculo</h3>
<div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-700 ease-in-out">
<p className="font-label-sm text-secondary uppercase tracking-widest mt-2">Crítico Literario</p>
<p className="font-body-md text-sm text-on-surface-variant mt-2 px-4">Especialista en literatura comparada y la evolución del lenguaje digital.</p>
<div className="flex gap-4 mt-4 justify-center text-on-surface-variant">
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">mail</span></a>
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">share</span></a>
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">person</span></a>
</div>
</div></div>
{/*  Writer 4  */}
<div className="flex flex-col items-center text-center group cursor-pointer"><div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-outline-variant p-1">
<img alt="Writer Portrait" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAD7aOXiutEVDT9jYDxoU9P5n5jn1KTj0moYm8P-83dwUOKAxxY7GZnNUGX6uHQVszrS_OeznE-r0dOo4JfN7oPwcPW4a5FGrHWsKpJRR3zK-yrLy9g9ktYNZXC1cPY72UbICPpMSU0Nd2OSR6BlyBHMelPHjklLKzCIndtKgGQITSiv0UZKUQ_KdM-OsouBbgmVIkvVfc1a-tuHFg3k08TWb_n654yxGUiQXG4t00WFXPab3b7QN2bySGtDJby22UBr2pl4jGD6Yk" />
</div>
<span className="font-label-md text-label-md text-primary uppercase tracking-widest mb-1">Beatrice Owe</span>
<h3 className="font-headline-md text-[20px] leading-[28px] text-on-surface-variant group-hover:text-secondary transition-colors duration-300">Reflexiones al Atardecer</h3>
<div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-700 ease-in-out">
<p className="font-label-sm text-secondary uppercase tracking-widest mt-2">Filósofa y Urbanista</p>
<p className="font-body-md text-sm text-on-surface-variant mt-2 px-4">Investigando la relación entre el entorno construido y la psique humana.</p>
<div className="flex gap-4 mt-4 justify-center text-on-surface-variant">
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">mail</span></a>
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">share</span></a>
<a href="#" className="hover:text-secondary transition-colors"><span className="material-symbols-outlined text-[18px]">person</span></a>
</div>
</div></div>
</div>
</section>
{/*  Article Grid  */}
<section className="border-t border-outline-variant pt-12">
<div className="grid grid-cols-1 md:grid-cols-3 gap-x-gutter gap-y-16">
{/*  Article Card 1  */}
<article className="flex flex-col group cursor-pointer">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Política</span>
<h3 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors duration-300 line-clamp-3">
                        El Fin del Consenso: Cómo las Narrativas Fracturadas Moldean la Política
                    </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-3">
                        A medida que la información centralizada se desmorona, la gobernabilidad lucha por encontrar una base común. Una mirada a las realidades dispares que forman el discurso político moderno.
                    </p>
<div className="mt-auto border-t border-outline-variant pt-3 w-1/3">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Miriam Rothschild</span>
</div>
</article>
{/*  Article Card 2  */}
<article className="flex flex-col group cursor-pointer">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Literatura</span>
<h3 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors duration-300 line-clamp-3">
                        Releyendo a Proust en la Era de la Interrupción Constante
                    </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-3">
                        Intentar una lectura extensa cuando la mente ha sido reconfigurada por la inmediatez digital. ¿Podemos aún acceder a la profundidad de la memoria involuntaria?
                    </p>
<div className="mt-auto border-t border-outline-variant pt-3 w-1/3">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Julian Thorne</span>
</div>
</article>
{/*  Article Card 3  */}
<article className="flex flex-col group cursor-pointer">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Economía</span>
<h3 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors duration-300 line-clamp-3">
                        La Ilusión del Crecimiento Infinito en Sistemas Finitos
                    </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-3">
                        Desafiando el mito fundacional del capitalismo moderno. Cuando las restricciones biológicas se encuentran con la teoría económica.
                    </p>
<div className="mt-auto border-t border-outline-variant pt-3 w-1/3">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Alistair Sterling</span>
</div>
</article>
{/*  Article Card 4  */}
<article className="flex flex-col group cursor-pointer md:col-span-2 bg-surface-container-low p-8 border border-outline-variant">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Reflexiones</span>
<h3 className="font-display-lg-mobile md:text-[40px] md:leading-[48px] font-headline-md text-primary mb-4 group-hover:text-secondary transition-colors duration-300">
                        Sobre el Caminar: El Ritmo del Pensamiento y el Cadencia de los Suburbios
                    </h3>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
                        Existe una cadencia específica en la mente cuando nos movemos a tres millas por hora. Observar la arquitectura mundana de las calles residenciales para comprender la arquitectura de nuestras propias ansiedades.
                    </p>
<div className="mt-auto border-t border-outline-variant pt-4 w-1/4">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Beatrice Owe</span>
</div>
</article>
{/*  Article Card 5  */}
<article className="flex flex-col group cursor-pointer">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Filosofía</span>
<h3 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors duration-300 line-clamp-3">
                        El Renacimiento Estoico: Consuelo en el Control
                    </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-3">
                        Por qué una antigua filosofía de resistencia es de repente atractiva para una generación que se enfrenta a una abrumadora incertidumbre sistémica.
                    </p>
<div className="mt-auto border-t border-outline-variant pt-3 w-1/3">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Eleanor Vance</span>
</div>
</article>
</div>
</section>
</main>
{/*  Footer  */}
<footer className="bg-surface-container-low border-t border-outline-variant w-full mt-auto">
<div className="w-full py-section-gap px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-start max-w-container-max mx-auto gap-12 md:gap-0">
<div className="flex flex-col gap-4">
<a className="font-headline-sm text-headline-sm text-primary" href="#">El Dialecto</a>
<p className="font-label-sm text-label-sm text-on-surface-variant max-w-xs">
                    Discurso intelectual y filosófico.
                </p>
</div>
<div className="flex flex-col gap-4">
<h4 className="font-label-sm text-label-sm text-primary uppercase tracking-widest">Navegación</h4>
<nav className="flex flex-col gap-2">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">Acerca de</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">Archivos</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">Autores</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">Equipo Editorial</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">Privacidad</a>
</nav>
</div>
<div className="flex flex-col gap-4 max-w-xs">
<h4 className="font-label-sm text-label-sm text-primary uppercase tracking-widest">Boletín</h4>
<p className="font-body-md text-body-md text-on-surface-variant">Recibe ensayos semanales directamente en tu bandeja de entrada.</p>
<form className="flex w-full mt-2" onSubmit={(e) => e.preventDefault()}>
<input className="bg-transparent border-b border-outline-variant focus:border-secondary focus:ring-0 px-0 py-2 w-full font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant outline-none rounded-none" placeholder="Dirección de correo electrónico" type="email" />
<button className="font-label-sm text-label-sm text-primary uppercase tracking-widest ml-4 hover:text-secondary transition-colors duration-300" type="submit">Enviar</button>
</form>
</div>
</div>
<div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-6 border-t border-outline-variant/50">
<p className="font-label-sm text-label-sm text-on-surface-variant text-center md:text-left">
                © 2024 El Dialecto. Todos los derechos reservados.
            </p>
</div>
</footer>



    </>
  );
}
