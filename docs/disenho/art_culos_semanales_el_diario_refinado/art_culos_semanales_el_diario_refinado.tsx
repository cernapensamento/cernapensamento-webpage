import React from 'react';

export default function ArtCulosSemanalesElDiarioRefinado() {
  return (
    <>

{/*  TopNavBar  */}
<nav className="bg-background border-b border-outline-variant w-full px-margin-mobile md:px-margin-desktop py-4 sticky top-0 z-50">
<div className="flex justify-between items-center w-full max-w-container-max mx-auto">
{/*  Navigation Links  */}
<div className="hidden md:flex gap-6 items-center">
<a className="font-label-md text-label-md text-on-surface-variant tracking-widest hover:text-secondary transition-colors duration-300" href="#">Philosophy</a>
<a className="font-label-md text-label-md text-on-surface-variant tracking-widest hover:text-secondary transition-colors duration-300" href="#">Economics</a>
<a className="font-label-md text-label-md text-on-surface-variant tracking-widest hover:text-secondary transition-colors duration-300" href="#">Politics</a>
<a className="font-label-md text-label-md text-on-surface-variant tracking-widest hover:text-secondary transition-colors duration-300" href="#">Literature</a>
<a className="font-label-md text-label-md text-on-surface-variant tracking-widest hover:text-secondary transition-colors duration-300" href="#">Reflections</a>
</div>
{/*  Mobile Menu Icon (Placeholder for functionality)  */}
<button className="md:hidden text-primary">
<span className="material-symbols-outlined text-[24px]">menu</span>
</button>
{/*  Brand Logo  */}
<a className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tighter absolute left-1/2 -translate-x-1/2" href="#">The Journal</a>
{/*  Trailing Action  */}
<div className="flex items-center gap-4">
<button className="text-primary hover:text-secondary transition-colors duration-300 hidden md:block">
<span className="material-symbols-outlined text-[24px]">search</span>
</button>
<button className="font-label-md text-label-md text-on-primary bg-primary px-4 py-2 hover:bg-surface-tint transition-colors duration-300 uppercase tracking-wider">
                    Subscribe
                </button>
</div>
</div>
</nav>
{/*  Main Content Canvas  */}
<main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-12 pb-section-gap flex flex-col gap-section-gap">
{/*  Hero Section: Featured Article  */}
<section className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
<div className="md:col-span-7 h-[400px] md:h-[600px] relative w-full overflow-hidden">
<img alt="Featured Article Image" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-in-out cursor-pointer" data-alt="A striking, high-contrast monochrome photograph of an empty, brutalist concrete hallway leading towards a starkly lit doorway. Deep shadows and bright highlights evoke a sense of isolation and philosophical introspection, aligning with a refined, intellectual editorial style. Black and white, highly detailed." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7FADb8L81KTsimkAtTv_ZHrmPpnz2ihXFsZRjHHLRDWD_brbO0B2kqn5fLW4t-ub_WvKvOg81TOaH4XVkJ-VTH3Y0wB6YtelzQwpH4brNLVfPNHoDkKorsyoEtdeDDUrc0N5DgE1rcca9hpAgWjO-PYdi5-Lt799e7-BGZSVEPHg-PFvaiBFXuCTAkfMvQDI64Tb6WrBjF6Gv7STD1U2Ue3ogU14aH9szSbmmytcEnTkqPBbnocNuu7TTaUrrPlG0RX0Jwv4a_xw"/>
</div>
<div className="md:col-span-5 flex flex-col gap-6 pt-6 md:pt-0">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest">Philosophy • Featured</span>
<h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary cursor-pointer hover:text-secondary transition-colors duration-300">
                    The Architecture of Silence: Finding Meaning in the Void
                </h1>
<p className="font-body-md text-body-md text-on-surface-variant">
                    An exploration into how modern spaces construct the absence of sound, and whether true silence is an objective reality or a psychological projection within contemporary society.
                </p>
<div className="pt-4 border-t border-outline-variant w-1/4 mt-2">
<span className="font-label-md text-label-md text-on-surface">By Eleanor Vance</span>
</div>
</div>
</section>
{/*  Writers' Columns  */}
<section className="border-t border-outline-variant pt-12">
<h2 className="font-headline-sm text-headline-sm text-primary mb-8 text-center uppercase tracking-widest">The Columnists</h2>
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter">
{/*  Writer 1  */}
<div className="flex flex-col items-center text-center group cursor-pointer">
<div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-outline-variant p-1">
<img alt="Writer Portrait" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" data-alt="A refined, black and white portrait photograph of a thoughtful older man in a tailored tweed suit, looking slightly off-camera. The lighting is soft and natural, emphasizing texture and intellectual gravitas. High quality, editorial style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkClvumTzIc_-8sSE9y5Prw8uuOJBmNv_yyDQ_7NLkq1ObD2QMso-8sE4pfp0QNU6xQcCkICnkiV6cFzOj5SFeWTzyPu-qOvbBFjIT5cRPz_fIsdVRsyxEGvp0YKwwDVfBu7qKMvTsuPz1R209PA5bQyzYYcfVafaKWfOkXPdskEmbIZoJk6aIZITnPURxPijtCpaZpkE8ONe1ckJ6z48UZgnq6bxfzzJ3_ZAoHEw09yMNagwgdjU0gYfekmO5OWbYr2XvofAToow"/>
</div>
<span className="font-label-md text-label-md text-primary uppercase tracking-widest mb-1">Alistair Sterling</span>
<h3 className="font-headline-md text-[20px] leading-[28px] text-on-surface-variant group-hover:text-secondary transition-colors duration-300">The Economics of Scarcity</h3>
</div>
{/*  Writer 2  */}
<div className="flex flex-col items-center text-center group cursor-pointer">
<div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-outline-variant p-1">
<img alt="Writer Portrait" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" data-alt="A refined, black and white portrait photograph of a striking woman with short dark hair, wearing a minimalist black turtleneck. She stares directly into the lens with intensity. The lighting is dramatic and high-contrast. High quality, editorial style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9q1SN42Xj49Bi2NNrzPGThG86CgN_YoNOFhhl7RvRV3as2Ya6dCJhnf1tXvxUHYLE1ivmvL4SWWZy1BLI-kUEi-8o8-a5PvuxklMTpYm9L3XNaGOhOM1BR-J6Nw6LvOB0Ld6UpMvaq6su6mXK1ujYCTftHDUuJQkhMlRDoRxxDNhq3oAxlpCHS8w73dUdR5ydO5WGLoeEXoJD_bVD3p1GnSZ1YaGsqz7k22iWNnr4viD1c23qULM2QNWZVO3Rc3PmOjrATLJPLYo"/>
</div>
<span className="font-label-md text-label-md text-primary uppercase tracking-widest mb-1">Miriam Rothschild</span>
<h3 className="font-headline-md text-[20px] leading-[28px] text-on-surface-variant group-hover:text-secondary transition-colors duration-300">Political Fictions</h3>
</div>
{/*  Writer 3  */}
<div className="flex flex-col items-center text-center group cursor-pointer">
<div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-outline-variant p-1">
<img alt="Writer Portrait" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" data-alt="A refined, black and white portrait photograph of a young man with round spectacles and a slightly messy haircut, sitting in a library setting softly blurred in the background. The mood is academic and introspective. High quality, editorial style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvayGb6MF_1nAC_2JGeY5aazkKg9xtpVLr_VAYRCRHJ4IGnhQsnY80WUwgk1afGTxcQoMrY04sxM6F7Db9Y-J2LnwHGHArEYYFhVsK_T3_7jjF4qXNFIiDyfh-B4khnKHB1ltW7Ip1vccPKyZmbIJn4P-DIazF1V4Yda23biPiPZpMiHf3wZs0RdGrw-yjohb96oaMCnYAdJHLq6ZcFeN8hRdqXLcLn8isU77dvkMYg-s-_Y-zfltWuX6O_YgTCYmcV25iG21tHD8"/>
</div>
<span className="font-label-md text-label-md text-primary uppercase tracking-widest mb-1">Julian Thorne</span>
<h3 className="font-headline-md text-[20px] leading-[28px] text-on-surface-variant group-hover:text-secondary transition-colors duration-300">Notes on the Vernacular</h3>
</div>
{/*  Writer 4  */}
<div className="flex flex-col items-center text-center group cursor-pointer">
<div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-outline-variant p-1">
<img alt="Writer Portrait" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" data-alt="A refined, black and white portrait photograph of a dignified woman with silver hair tied back, wearing a simple linen blouse. The background is a stark white wall, focusing entirely on her calm expression. High quality, editorial style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAD7aOXiutEVDT9jYDxoU9P5n5jn1KTj0moYm8P-83dwUOKAxxY7GZnNUGX6uHQVszrS_OeznE-r0dOo4JfN7oPwcPW4a5FGrHWsKpJRR3zK-yrLy9g9ktYNZXC1cPY72UbICPpMSU0Nd2OSR6BlyBHMelPHjklLKzCIndtKgGQITSiv0UZKUQ_KdM-OsouBbgmVIkvVfc1a-tuHFg3k08TWb_n654yxGUiQXG4t00WFXPab3b7QN2bySGtDJby22UBr2pl4jGD6Yk"/>
</div>
<span className="font-label-md text-label-md text-primary uppercase tracking-widest mb-1">Beatrice Owe</span>
<h3 className="font-headline-md text-[20px] leading-[28px] text-on-surface-variant group-hover:text-secondary transition-colors duration-300">Reflections at Dusk</h3>
</div>
</div>
</section>
{/*  Article Grid  */}
<section className="border-t border-outline-variant pt-12">
<div className="grid grid-cols-1 md:grid-cols-3 gap-x-gutter gap-y-16">
{/*  Article Card 1  */}
<article className="flex flex-col group cursor-pointer">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Politics</span>
<h3 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors duration-300 line-clamp-3">
                        The End of Consensus: How Fractured Narratives Shape Policy
                    </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-3">
                        As centralized information crumbles, governance struggles to find a common grounding. A look into the disparate realities forming modern political discourse.
                    </p>
<div className="mt-auto border-t border-outline-variant pt-3 w-1/3">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Miriam Rothschild</span>
</div>
</article>
{/*  Article Card 2  */}
<article className="flex flex-col group cursor-pointer">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Literature</span>
<h3 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors duration-300 line-clamp-3">
                        Re-reading Proust in the Age of Constant Interruption
                    </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-3">
                        Attempting long-form reading when the mind has been rewired by digital immediacy. Can we still access the depth of involuntary memory?
                    </p>
<div className="mt-auto border-t border-outline-variant pt-3 w-1/3">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Julian Thorne</span>
</div>
</article>
{/*  Article Card 3  */}
<article className="flex flex-col group cursor-pointer">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Economics</span>
<h3 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors duration-300 line-clamp-3">
                        The Illusion of Infinite Growth in Finite Systems
                    </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-3">
                        Challenging the foundational myth of modern capitalism. When biological constraints meet economic theory.
                    </p>
<div className="mt-auto border-t border-outline-variant pt-3 w-1/3">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Alistair Sterling</span>
</div>
</article>
{/*  Article Card 4  */}
<article className="flex flex-col group cursor-pointer md:col-span-2 bg-surface-container-low p-8 border border-outline-variant">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Reflections</span>
<h3 className="font-display-lg-mobile md:text-[40px] md:leading-[48px] font-headline-md text-primary mb-4 group-hover:text-secondary transition-colors duration-300">
                        On Walking: The Pace of Thought and the Rhythm of the Suburbs
                    </h3>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
                        There is a specific cadence to the mind when moving at three miles an hour. Observing the mundane architecture of residential streets to understand the architecture of our own anxieties.
                    </p>
<div className="mt-auto border-t border-outline-variant pt-4 w-1/4">
<span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Beatrice Owe</span>
</div>
</article>
{/*  Article Card 5  */}
<article className="flex flex-col group cursor-pointer">
<span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-3">Philosophy</span>
<h3 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors duration-300 line-clamp-3">
                        The Stoic Revival: Comfort in Control
                    </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-3">
                        Why an ancient philosophy of endurance is suddenly appealing to a generation facing overwhelming systemic uncertainty.
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
<a className="font-headline-sm text-headline-sm text-primary" href="#">The Journal</a>
<p className="font-label-sm text-label-sm text-on-surface-variant max-w-xs">
                    Intellectual and philosophical discourse.
                </p>
</div>
<div className="flex flex-col gap-4">
<h4 className="font-label-sm text-label-sm text-primary uppercase tracking-widest">Navigation</h4>
<nav className="flex flex-col gap-2">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">About</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">Archives</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">Authors</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">Masthead</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline decoration-1 underline-offset-4 transition-all duration-200" href="#">Privacy</a>
</nav>
</div>
<div className="flex flex-col gap-4 max-w-xs">
<h4 className="font-label-sm text-label-sm text-primary uppercase tracking-widest">Newsletter</h4>
<p className="font-body-md text-body-md text-on-surface-variant">Receive weekly essays directly to your inbox.</p>
<form className="flex w-full mt-2" onSubmit={(e) => e.preventDefault()}>
<input className="bg-transparent border-b border-outline-variant focus:border-secondary focus:ring-0 px-0 py-2 w-full font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant outline-none rounded-none" placeholder="Email address" type="email"/>
<button className="font-label-sm text-label-sm text-primary uppercase tracking-widest ml-4 hover:text-secondary transition-colors duration-300" type="submit">Submit</button>
</form>
</div>
</div>
<div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-6 border-t border-outline-variant/50">
<p className="font-label-sm text-label-sm text-on-surface-variant text-center md:text-left">
                © 2024 The Refined Journal. All rights reserved.
            </p>
</div>
</footer>

    </>
  );
}
