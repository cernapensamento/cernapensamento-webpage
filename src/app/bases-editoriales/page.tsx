import React from 'react';
import Link from 'next/link';
import PublicNavBar from '@/components/PublicNavBar';
import SiteFooter from '@/components/SiteFooter';

export const metadata = {
  title: 'Proxecto Editorial | Cerna',
  description: 'Criterios editoriais que regulan a elaboración, avaliación e publicación dos artigos semanais de CERNA.',
};

export default function BasesEditoriales() {
  return (
    <div className="min-h-screen bg-parchment flex flex-col selection:bg-gold/20 selection:text-charcoal">
      <PublicNavBar showBackLink />
      
      <main className="flex-grow pt-32 pb-24">
        <article className="max-w-[800px] mx-auto px-5 md:px-0">
          
          {/* Header Section */}
          <header className="mb-20 text-center">
            <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-4">
              Documento de Traballo
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight mb-8">
              Proxecto Editorial da Colección Artigos de Opinión CERNA
            </h1>
            <div className="w-24 h-px bg-lines mx-auto"></div>
          </header>

          {/* 1. Obxecto */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">1. Obxecto</h2>
            <div className="font-sans text-base text-charcoal/80 leading-relaxed first-letter:float-left first-letter:font-serif first-letter:text-7xl first-letter:text-gold first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8]">
              O presente documento ten por finalidade establecer os criterios editoriais que regulan a elaboración, avaliación e publicación dos artigos semanais de CERNA. Constitúe un instrumento de orientación para os autores e para o Consello Editorial, co propósito de garantir a coherencia da colección, a calidade das publicacións e a consolidación dunha identidade editorial propia.
            </div>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              Os criterios aquí recollidos deberán interpretarse conforme aos principios xerais da liña editorial de CERNA e non como un conxunto pechado de regras de carácter estritamente formal.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              Ademais, é responsabilidade do Consello garantir a consolidación desta publicación así como do Coordinador vixiar que todos os membros colaboran nela. Todos os integrantes do Consello deberán colaborar activamente no seu desenvolvemento, asumindo a responsabilidade compartida de garantir a súa calidade, periodicidade e estabilidade.
            </p>
          </section>

          {/* 2. Natureza dos artigos */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">2. Natureza dos artigos</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed">
              Os artigos semanais constitúen a publicación periódica ordinaria de CERNA e configuran o principal espazo de reflexión continuada da entidade.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              A súa finalidade consiste en contribuír ao desenvolvemento dun pensamento galego contemporáneo, facilitando aportacións xuvenís, mediante textos breves, rigorosos e accesibles que non descoiden aspectos formais pero se dirixan a un público amplo e non especializado. Tamén se busca ofrecer un espazo de opinión e reflexións de temas de actualidade e sociedade.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              Cada artigo deberá presentar unha reflexión propia, construída sobre unha argumentación ordenada e capaz de suscitar novas preguntas ou abrir vías de discusión.
            </p>
          </section>

          {/* 3. Sobre a continuidade da publicación */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">3. Sobre a continuidade da publicación</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed">
              O Consello velará pola prosperidade desta publicación. Para tal fin, todos os membros do Consello terán a obriga de contribuír á publicación mediante a incorporación á súa columna dos textos propios necesarios para garantir a periodicidade establecida. Por iso, en caso de non xurdir textos de socios ou colaboradores, serán os propios conselleiros os que deberán subir á súa columna textos que cumpran as esixencias desta publicación, segundo o que en cada momento se precise de acordo co número de membros e o número de textos dispoñibles.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              Ao mesmo tempo, as publicacións dos Conselleiros validaranse como calquera outra publicación na columna e, en consecuencia, farase segundo o establecido no Artigo 58 do Regulamento de Réxime Interno do Consello Editorial de Cerna Pensamento do 8 de Xullo do 2026. Con todo, isto non eximirá de cumprir con requisitos formais e tipográficos dispostos no Artigo 9 deste documento, sen prexuízo de cumprir os criterios de extensión, estilo etc., que os propios Conselleiros tamén deben cumprir.
            </p>
          </section>

          {/* 4. Principios editoriais */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">4. Principios editoriais</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mb-6">
              Os artigos publicados por CERNA inspiraranse nos seguintes principios:
            </p>
            <ul className="space-y-4 font-sans text-base text-charcoal/80 pl-6 list-disc">
              <li><strong>Primacía do argumento sobre a opinión.</strong></li>
              <li><strong>Rigor intelectual.</strong></li>
              <li><strong>Independencia de criterio.</strong></li>
              <li><strong>Disposición ao diálogo e ao contraste de posicións.</strong></li>
              <li><strong>Compromiso coa lingua galega como lingua de cultura.</strong></li>
              <li><strong>Vocación de permanencia,</strong> procurando que os textos conserven interese máis alá da actualidade inmediata.</li>
            </ul>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-6 italic text-gold">
              A excelencia editorial prevalecerá sempre sobre consideracións relativas á frecuencia de publicación ou ao volume de contidos.
            </p>
          </section>

          {/* 5. Linguas de uso */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">5. Linguas de uso</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mb-4">
              De acordo co disposto no Artigo 3, así como en consonancia cos principios establecidos polos Estatutos e o Regulamento de Réxime Interno, establécese a lingua galega como habitual desta publicación. Os membros do Consello coidarán deste compromiso, podendo aceptarse textos noutras linguas nos seguintes casos:
            </p>
            <div className="space-y-4 pl-6 border-l-2 border-gold/30">
              <p className="font-sans text-base text-charcoal/80 leading-relaxed">
                <strong>a)</strong> Cando nunha colaboración xustificada e promovida por un membro do Consello o colaborador non sexa galego ou non teña o suficiente dominio da lingua galega.
              </p>
              <p className="font-sans text-base text-charcoal/80 leading-relaxed">
                <strong>b)</strong> Cando un socio queira exercer o seu dereito de publicar mais non teña os dominios requiridos en lingua galega, ou prefira facelo en español. Non obstante, o Consello poderá denegar este uso cando se de xeito repetido e ou indefinido, promovendo sempre os principios da Asociación e o seu compromiso coa lingua galega.
              </p>
            </div>
          </section>

          {/* 6. Ámbito temático */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">6. Ámbito temático</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed">
              CERNA promoverá preferentemente artigos que contribúan á comprensión da realidade galega e do mundo contemporáneo desde unha perspectiva reflexiva e interdisciplinaria. Poderán abordarse cuestións relacionadas coa filosofía, a historia, a literatura, a lingua, o patrimonio, a universidade, a educación, a economía, o dereito, a política pública, a ciencia, a tecnoloxía, a intelixencia artificial, a cultura, a identidade, Europa ou calquera outro ámbito que resulte conforme coa liña editorial da entidade.
            </p>
            <p className="font-sans text-xs text-charcoal/50 italic mt-2">
              * A relación anterior ten carácter meramente orientativo.
            </p>
          </section>

          {/* 7. Estrutura dos artigos */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">7. Estrutura dos artigos</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed">
              Conforme aos principios expostos, CERNA promoverá o cultivo do artigo breve en todas as súas posibilidades expresivas. A colección aspira a reunir textos con personalidade propia, liberdade formal e unha voz recoñecible, afastándose de modelos excesivamente ríxidos ou uniformes.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              Os artigos non deberán limitarse á mera exposición de feitos nin á simple defensa dunha opinión, senón que procurarán desenvolver unha reflexión persoal mediante unha argumentación sólida, unha escrita coidada e unha perspectiva orixinal.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4 mb-4">
              Con todo, recoméndase con carácter meramente orientativo a adopción do seguinte esquema:
            </p>
            <ul className="space-y-3 font-sans text-base text-charcoal/80 pl-6 list-none">
              <li><strong>a)</strong> Formulación da cuestión ou do problema obxecto de análise.</li>
              <li><strong>b)</strong> Exposición do contexto necesario para a súa comprensión.</li>
              <li><strong>c)</strong> Desenvolvemento da tese principal mediante argumentos suficientemente fundamentados.</li>
              <li><strong>d)</strong> Consideración das posibles obxeccións ou interpretacións alternativas.</li>
              <li><strong>e)</strong> Conclusión orientada a sintetizar a reflexión realizada e a abrir novas liñas de pensamento.</li>
            </ul>
          </section>

          {/* 8. Extensión */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">8. Extensión</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed">
              A extensión ordinaria dos artigos situarase <strong>entre as 800 e as 1.200 palabras</strong>.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              O Consello Editorial poderá admitir textos de maior ou menor extensión cando a natureza da materia así o xustifique.
            </p>
          </section>

          {/* 9. Estilo */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">9. Estilo</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed">
              Os artigos publicados por CERNA responderán ao xénero do artigo persoal e caracterizaranse pola liberdade de estilo, a personalidade da voz do autor e o coidado da expression escrita.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              Cada texto deberá constituír unha reflexión propia, elaborada desde a experiencia, o coñecemento ou o criterio persoal do seu autor, evitando tanto a mera exposición de información como a reprodución de opinións alleas sen elaboración crítica.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              CERNA non promove un modelo único de escrita. Terán cabida artigos de natureza reflexiva, narrativa, evocadora ou argumentativa, sempre que presenten unidade, coherencia interna e interese intelectual.
            </p>
          </section>

          {/* 10. Fontes e referencias */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">10. Fontes e referencias</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed">
              O xénero do artigo persoal ou de columna non inclúe nin precisa o emprego de fontes documentais, notas a pé de páxina ou outro tipo de aparello crítico. Pola contra, deben ser textos que se interpreten por si mesmos. O protagonismo do artigo corresponde á reflexión do autor e non á reprodución de autoridades alleas.
            </p>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mt-4">
              Cando resulte imprescindible facer referencia a unha obra ou documento, esta integrarase no propio discurso, sen interromper o desenvolvemento da lectura.
            </p>
          </section>

          {/* Pull Quote */}
          <section className="mb-16 px-8 md:px-20 border-l border-r border-gold/30 py-4 text-center">
            <blockquote className="font-serif text-2xl text-charcoal italic leading-relaxed">
              "A identidade gráfica e intelectual define a excelencia de CERNA."
            </blockquote>
          </section>

          {/* 11. Libro de estilo */}
          <section className="mb-16 bg-surface p-10 border border-lines">
            <h2 className="font-serif text-2xl text-charcoal mb-6">11. Libro de estilo</h2>
            <p className="font-sans text-sm text-charcoal/70 mb-6">
              Co fin de garantir unha identidade editorial común, os artigos observarán os seguintes criterios formais:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans text-charcoal/80">
              <div><strong>a) Tipografía:</strong> Times New Roman, corpo 12 pt, interliñado 1,5.</div>
              <div><strong>b) Títulos:</strong> Negra, corpo 16 pt.</div>
              <div><strong>c) Subtítulos:</strong> Negra, corpo 14 pt.</div>
              <div><strong>d) Aliñación:</strong> Xustificado, sen partición de palabras.</div>
              <div><strong>e) Sangrado:</strong> 1,25 cm en primeira liña (agás a posterior a un título).</div>
              <div><strong>f) Negras:</strong> Reservada para títulos e subtítulos.</div>
              <div><strong>g) Cursivas:</strong> Para libros, estranxeirismos ou latinismos.</div>
              <div><strong>h) Citación:</strong> Norma APA 7 coas adaptacións do proxecto (máximo 3 citas textuais).</div>
              <div><strong>i) Tipos excluídos:</strong> Evitar subliñados e versais integrais.</div>
              <div><strong>j) Comiñas:</strong> Angulares (« ») de uso ordinario.</div>
              <div><strong>k) Listas:</strong> Mediante letras ou guións, evitando viñetas.</div>
              <div><strong>l) Formato de páxina:</strong> Marges de 2,5 cm, tamaño A4.</div>
            </div>
          </section>

          {/* 12. Avaliación editorial */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">12. Avaliación editorial</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed mb-6">
              Na valoración dos artigos o Consello Editorial atenderá especialmente ao interese intelectual, á coherencia argumentativa, á orixinalidade, á corrección lingüística e á adecuación á liña editorial de CERNA.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-lines p-6 bg-surface">
                <span className="font-sans text-[10px] text-gold uppercase tracking-widest mb-3 block">Fase 1</span>
                <h4 className="font-serif text-xl text-charcoal mb-2">Revisión Inicial</h4>
                <p className="text-xs text-charcoal/60 font-sans">Revisión polo membro do Consello encargado da tramitación.</p>
              </div>
              <div className="border border-lines p-6 bg-surface">
                <span className="font-sans text-[10px] text-gold uppercase tracking-widest mb-3 block">Fase 2</span>
                <h4 className="font-serif text-xl text-charcoal mb-2">Devolución / Axustes</h4>
                <p className="text-xs text-charcoal/60 font-sans">Se é preciso, indícanse suxestións estilísticas ou correccións motivadas.</p>
              </div>
              <div className="border border-lines p-6 bg-surface">
                <span className="font-sans text-[10px] text-gold uppercase tracking-widest mb-3 block">Fase 3</span>
                <h4 className="font-serif text-xl text-charcoal mb-2">Deliberación</h4>
                <p className="text-xs text-charcoal/60 font-sans">O Consello Editorial debate e resolve sobre a súa publicación final.</p>
              </div>
            </div>
          </section>

          {/* 13. Identidade da colección & 14. Consideración derradeira */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">13. Identidade da colección</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed">
              Os artigos semanais de CERNA constitúen unha colección editorial unitaria e responderán a unha identidade común, tanto na súa presentación formal como na concepción intelectual que inspira a publicación. A identidade gráfica e a escrita persoal, rigorosa e coidada son os nosos alicerces.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 border-b border-lines pb-2">14. Consideración derradeira</h2>
            <p className="font-sans text-base text-charcoal/80 leading-relaxed">
              Os autores conservarán a titularidade dos dereitos de propiedade intelectual sobre os seus artigos. Sen prexuízo do anterior, autorizarán a CERNA PENSAMENTO para a súa publicación e difusión a través dos medios propios da entidade. Nas reedicións ou publicacións posteriores deberá facerse constar que a primeira publicación do texto tivo lugar en CERNA Pensamento.
            </p>
          </section>

          {/* Contact Section */}
          <section className="mt-20 pt-20 border-t border-lines text-center">
            <h3 className="font-serif text-3xl text-charcoal mb-6">Contacto Editorial</h3>
            <p className="font-sans text-base text-charcoal/60 mb-10 max-w-lg mx-auto">
              Se tes algunha dúbida sobre o proceso de revisión editorial, desexas propor unha temática especial ou queres colaborar co Consello Editorial, podes escribirnos directamente.
            </p>
            <a 
              href="mailto:redaccion@cerna.com" 
              className="inline-block bg-charcoal text-parchment px-12 py-5 font-sans text-xs uppercase tracking-[0.15em] hover:bg-gold transition-colors duration-300"
            >
              redaccion@cerna.com
            </a>
          </section>

        </article>
      </main>
      
      <SiteFooter variant="full" />
    </div>
  );
}
