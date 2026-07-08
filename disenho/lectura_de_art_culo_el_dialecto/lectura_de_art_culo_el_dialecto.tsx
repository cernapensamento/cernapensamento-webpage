import React from 'react';

export default function LecturaDeArtCuloElDialecto() {
  return (
    <>

{/*  TopNavBar  */}
<header className="bg-surface dark:bg-surface font-label-md text-label-md tracking-[0.05em] full-width top-0 border-b border-outline-variant dark:border-outline flat no shadows z-50 sticky">
<div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-20">
{/*  Brand Logo  */}
<a className="font-display-lg text-display-lg text-primary dark:text-on-primary-fixed md:hidden font-display-lg-mobile text-display-lg-mobile" href="#">
                El Dialecto
            </a>
<a className="font-display-lg text-display-lg text-primary dark:text-on-primary-fixed hidden md:block" href="#">
                El Dialecto
            </a>
{/*  Trailing Actions  */}
<div className="flex items-center gap-6">
<button aria-label="Search" className="text-on-surface-variant hover:text-secondary transition-colors">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 0"}}>search</span>
</button>
<a className="hidden sm:inline-flex items-center justify-center px-6 py-2 bg-primary text-on-primary hover:bg-inverse-surface transition-colors duration-300 cursor-pointer" href="#">
                    Suscribirse
                </a>
<button aria-label="Menu" className="md:hidden text-on-surface">
<span className="material-symbols-outlined">menu</span>
</button>
</div>
</div>
</header>
{/*  Main Content Canvas  */}
<main className="flex-grow flex flex-col items-center w-full pb-section-gap">
{/*  Article Header  */}
<header className="w-full max-w-3xl px-margin-mobile md:px-0 pt-24 pb-12 mx-auto text-center">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block mb-6">Filosofía y Espacio</span>
<h1 className="font-display-lg text-display-lg md:font-display-lg md:text-display-lg text-primary mb-6 max-w-4xl mx-auto">
                La arquitectura del silencio
            </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto italic">
                Cómo los entornos estructurales modernos eliminan inadvertidamente la profunda necesidad de contemplación tranquila.
            </p>
<div className="flex items-center justify-center gap-4 font-label-md text-label-md text-on-surface-variant">
<span className="text-primary border-b border-outline-variant pb-1">Eleanor Vance</span>
<span>—</span>
<time datetime="2024-10-24">24 de octubre de 2024</time>
</div>
</header>
{/*  Hero Image  */}
<div className="w-full max-w-container-max px-margin-mobile md:px-margin-desktop mb-20 mx-auto">
<img className="w-full h-[512px] md:h-[716px] object-cover grayscale-[20%] sepia-[10%]" data-alt="A striking, expansive photograph of a brutalist architectural interior. Soaring concrete walls create deep shadows and bright, sharp lines of natural light pouring in from an unseen skylight above. The space is entirely empty, conveying a profound sense of stillness and acoustic silence. The overall palette is muted greys, warm ivory light, and stark charcoal shadows, fitting a sophisticated, intellectual design aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB36j7za20DOk9ii6c7WDManBtU4-iMnvKWoR4qdio9P9Cv3BvfMowXdswr46gbZ1-SIbNZ-g8nUXMq4IJdYF_TFdD80pw7ONKYDTfrAtczbNA6nLZ98ci_svbhWkxJiIq3HhV5p-Y24_6_DthorT17_gu9TYuLOkX7BeDdmWBaaobkSw8FQX70yiHkyepSZBkqMWw8ajgq2_o0Hq1rFkN5WsZhSwtqYNvbrZmVviOIcoTXv9oQgBqOyKhM25P8TTgvs-GPSGvmRD8"/>
<figcaption className="font-label-sm text-label-sm text-outline mt-4 text-right">La estructura del Museo de Arte de Teshima. Fotografía de S. Nakamoto.</figcaption>
</div>
{/*  Article Body  */}
<article className="w-full max-w-2xl px-margin-mobile md:px-0 mx-auto font-body-lg text-body-lg text-on-surface leading-relaxed flex flex-col gap-8">
<p className="first-letter-drop">
                El silencio ya no es una ausencia; se ha convertido en una mercancía de lujo. En los extensos centros urbanos que definen el siglo XXI, el paisaje acústico está saturado. Existimos dentro de un zumbido persistente y de bajo grado de infraestructura, comercio y notificaciones digitales. Encontrar el silencio requiere una intervención arquitectónica deliberada: espacios diseñados explícitamente para repeler el ruido omnipresente de la modernidad.
            </p>
<p>
                Históricamente, el silencio era el estado predeterminado del entorno humano, puntuado por eventos: el viento, una voz, una herramienta golpeando la piedra. Hoy, ocurre lo inverso. Debemos construir activamente barreras para labrarnos tranquilidad. Este cambio altera fundamentalmente la cognición humana y la capacidad para una interioridad profunda y filosófica.
            </p>
<h2 className="font-headline-md text-headline-md text-primary mt-12 mb-4 pb-2 border-b border-outline-variant">La mercantilización de la tranquilidad</h2>
<p>
                Considere la evolución de la oficina moderna o del rascacielos residencial de lujo. El aislamiento acústico ahora se comercializa con el mismo fervor que los metros cuadrados o las vistas panorámicas. La capacidad de cerrar una puerta y separarse del colectivo auditivo es un privilegio otorgado principalmente a aquellos con los medios económicos para exigirlo.
            </p>
<blockquote className="my-12 px-8 py-6 border-l-[3px] border-secondary bg-surface-container-low text-center">
<p className="font-headline-sm text-headline-sm text-on-surface italic mb-4">
                    "Hemos confundido la conectividad con la presencia, y al hacerlo, hemos construido entornos a los que les aterroriza estar vacíos."
                </p>
<cite className="font-label-sm text-label-sm text-on-surface-variant not-italic tracking-widest uppercase">— Dr. Elias Thorne, El vacío sonoro</cite>
</blockquote>
<p>
                Esta privatización del silencio plantea profundas cuestiones económicas y éticas. Si la contemplación tranquila es esencial para la resolución de problemas complejos, la restauración psicológica y la formulación de estrategias cívicas a largo plazo, ¿qué significa cuando solo una fracción de la población tiene acceso a ella?
            </p>
<figure className="my-10 w-full md:-mx-12 md:w-[calc(100%+6rem)]">
<img className="w-full aspect-[16/9] object-cover" data-alt="A meticulously composed black and white photograph of a minimalist reading room. The room features a single, elegant wooden chair facing a tall, narrow window looking out onto a misty, unidentifiable landscape. Bookshelves line one wall perfectly. The lighting is soft and diffused, emphasizing the textures of wood and paper. The atmosphere is deeply serene, academic, and isolated." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxofc9I2fidLoWJHCQXogslAv1Z4NuW2jjoiNlMvywfz4_WYjlKrw7EN3B7N-kTSa6rXKBhwYovrq5VdwgD9PDHKjsAc8tc24N9x4k8HHbMIr7KoN9xW7O7KPM0IyXbvOkv1WFg-iacN4aPwmJuFFng33p1p7EANTdmWCzlxd0TaBS7S6ZGfwR51QEnK0AR12rH1SU-kefeSFmXy6_Z1Gg0nzQgt5DyrCcKyfJ05eMzcsKtS77Ze5N3lApywT2CFppGtc0j0zhBTg"/>
<figcaption className="font-label-sm text-label-sm text-outline mt-3 text-center">La sala de lectura en Villa Cernobbi, diseñada específicamente para el estudio solitario.</figcaption>
</figure>
<h2 className="font-headline-md text-headline-md text-primary mt-12 mb-4 pb-2 border-b border-outline-variant">Diseñando para la resonancia</h2>
<p>
                La tarea del arquitecto contemporáneo, entonces, no es meramente construir cerramientos, sino curar atmósferas. Requiere un retorno a materiales pesados —tierra apisonada, mampostería gruesa, madera densa— materiales que absorben y conectan a tierra la energía en lugar de reflejarla interminablemente como el cristal y el acero.
            </p>
<p>
                A medida que avanzamos, los espacios públicos más vitales no serán las plazas comerciales ruidosas e hiperconectadas, sino los vacíos intencionales. Bibliotecas, claustros seculares y santuarios acústicos deben integrarse en la planificación urbana no como ideas tardías, sino como necesidades fundamentales para una sociedad funcional y contemplativa.
            </p>
{/*  Article Footer / Author Bio  */}
<div className="mt-20 pt-8 border-t border-outline-variant flex items-start gap-6">
<div className="w-16 h-16 rounded-full bg-surface-variant flex-shrink-0 overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A sophisticated, high-contrast black and white portrait of an intellectual woman in her 40s. She is wearing a dark, textured turtleneck sweater and looking thoughtfully slightly off-camera. The lighting is dramatic, highlighting her sharp features against a pure white background, fitting a prestigious academic journal." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4LGfaCxRN7l6UxcqsadbnkvdToz8unqPjz3i88RnSF9k_pIR50YPliH84VOGh_09zTJe3HX-Z8Q1Tdd3tO5Oa0yFoNHD45J-EMIFMtvGyhgLJZAOssGvU1LYai9E_2M7xXqrEcMDcZFQ_Aaf-h-ZS1QwTcv_3DGEhusAHUURa6zK7LZEETVLVg6OteCnvAw2zMH7liBRmdzG_pjYdm535rGduw4Gp2YJ7qEfK2-S6pFHr9qX3U0vKOVg1-WN9k_xOMUQ9vkUkJE8"/>
</div>
<div>
<h3 className="font-label-md text-label-md text-primary uppercase tracking-widest mb-2">Sobre la autora</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Eleanor Vance es investigadora principal en Filosofía Urbana en el Instituto de Ética Espacial. Es autora del próximo libro <em>El sonido del hormigón</em>.</p>
</div>
</div>
</article>
</main>
{/*  Footer  */}
<footer className="bg-surface-container dark:bg-surface-container full-width border-t border-outline-variant dark:border-outline flat no shadows">
<div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-desktop py-12 max-w-container-max mx-auto gap-8">
{/*  Brand Logo  */}
<div className="font-headline-sm text-headline-sm text-primary dark:text-on-primary-fixed mb-4 md:mb-0">
                El Dialecto
            </div>
{/*  Links  */}
<nav className="flex flex-wrap justify-center gap-6 font-body-md text-body-md">
<a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed underline transition-all" href="#">Sobre nosotros</a>
<a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed underline transition-all" href="#">Consejo editorial</a>
<a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed underline transition-all" href="#">Envíos</a>
<a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed underline transition-all" href="#">Privacidad</a>
<a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed underline transition-all" href="#">Términos</a>
</nav>
{/*  Copyright  */}
<div className="font-body-md text-body-md text-on-surface dark:text-on-surface text-center md:text-right text-sm">
                © 2024 El Dialecto. Revista de Filosofía y Economía. Todos los derechos reservados.
            </div>
</div>
</footer>

    </>
  );
}
