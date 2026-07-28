import React from 'react';

export default function BasesContentGL() {
  return (
    <>
      {/* Header Section */}
      <header className="mb-20 text-center">
        <p className="font-sans text-xs text-gold uppercase tracking-[0.2em] mb-4">
          Documento de traballo
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight mb-8">
          Proxecto Editorial da Colección Artigos de Opinión CERNA
        </h1>
        <div className="w-24 h-px bg-lines mx-auto"></div>
      </header>

      {/* 1. Obxecto */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">1. Obxecto</h2>
        <div className="font-sans text-xl text-charcoal/80 leading-relaxed first-letter:float-left first-letter:font-serif first-letter:text-7xl first-letter:text-gold first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8]">
          O presente documento ten por finalidade establecer os criterios editoriais que regulan a elaboración, avaliación e publicación dos artigos semanais de CERNA. Constitúe un instrumento de orientación para os autores e para o Consello Editorial, co propósito de garantir a coherencia da colección, a calidade das publicacións e a consolidación dunha identidade editorial propia.
        </div>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Os criterios aquí recollidos deberán interpretarse conforme aos principios xerais da liña editorial de CERNA e non como un conxunto pechado de regras de carácter estritamente formal.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Ademais, é responsabilidade do Consello garantir a consolidación desta publicación así como do Coordinador vixiar que todos os membros colaboran nela. Todos os integrantes do Consello deberán colaborar activamente no seu desenvolvemento, asumindo a responsabilidade compartida de garantir a súa calidade, periodicidade e estabilidade.
        </p>
      </section>

      {/* 2. Natureza dos artigos */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">2. Natureza dos artigos</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
          Os artigos semanais constitúen a publicación periódica ordinaria de CERNA e configuran o principal espazo de reflexión continuada da entidade.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          A súa finalidade consiste en contribuír ao desenvolvemento dun pensamento galego contemporáneo, facilitando aportacións xuvenís, mediante textos breves, rigorosos e accesibles que non descoiden aspectos formais pero se dirixan a un público amplo e non especializado. Tamén se busca ofrecer un espazo de opinión e reflexións de temas de actualidade e sociedade.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Cada artigo deberá presentar unha reflexión propia, construída sobre unha argumentación ordenada e capaz de suscitar novas preguntas ou abrir vías de discusión.
        </p>
      </section>

      {/* 3. Sobre a continuidade da publicación */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">3. Sobre a continuidade da publicación</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
          O Consello velará pola prosperidade desta publicación. Para tal fin, todos os membros do Consello terán a obriga de contribuír á publicación mediante a incorporación á súa columna dos textos propios necesarios para garantir a periodicidade establecida. Por iso, en caso de non xurdir textos de socios ou colaboradores, serán os propios conselleiros os que deberán subir á súa columna textos que cumpran as esixencias desta publicación, segundo o que en cada momento se precise de acordo co número de membros e o número de textos dispoñibles.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Ao mesmo tempo, as publicacións dos Conselleiros validaranse como calquera outra publicación na columna e, en consecuencia, farase segundo o establecido no Artigo 58 do Regulamento de Réxime Interno do Consello Editorial de Cerna Pensamento do 8 de Xullo do 2026. Con todo, isto non eximirá de cumprir con requisitos formais e tipográficos dispostos no Artigo 9 deste documento, sen prexuízo de cumprir os criterios de extensión, estilo etc., que os propios Conselleiros tamén deben cumprir.
        </p>
      </section>

      {/* 4. Principios editoriais */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">4. Principios editoriais</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mb-6">
          Os artigos publicados por CERNA inspiraranse nos seguintes principios:
        </p>
        <ul className="space-y-4 font-sans text-xl text-charcoal/80 pl-6 list-none">
          <li><strong>a)</strong> Primacía do argumento sobre a opinión.</li>
          <li><strong>b)</strong> Rigor intelectual.</li>
          <li><strong>c)</strong> Independencia de criterio.</li>
          <li><strong>d)</strong> Disposición ao diálogo e ao contraste de posicións.</li>
          <li><strong>e)</strong> Compromiso coa lingua galega como lingua de cultura.</li>
          <li><strong>f)</strong> Vocación de permanencia, procurando que os textos conserven interese máis alá da actualidade inmediata.</li>
        </ul>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-6 italic text-gold">
          A excelencia editorial prevalecerá sempre sobre consideracións relativas á frecuencia de publicación ou ao volume de contidos.
        </p>
      </section>

      {/* 5. Linguas de uso */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">5. Linguas de uso</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mb-4">
          De acordo co disposto no Artigo 3, así como en consonancia cos principios establecidos polos Estatutos e o Regulamento de Réxime Interno, establécese a lingua galega como habitual desta publicación. Os membros do Consello coidarán deste compromiso, podendo aceptarse textos noutras linguas nos seguintes casos:
        </p>
        <div className="space-y-4 pl-6 border-l-2 border-gold/30">
          <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
            <strong>a)</strong> Cando nunha colaboración xustificada e promovida por un membro do Consello o colaborador non sexa galego ou non teña o suficiente dominio da lingua galega.
          </p>
          <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
            <strong>b)</strong> Cando un socio queira exercer o seu dereito de publicar mais non teña os dominios requiridos en lingua galega, ou prefira facelo en español. Non obstante, o Consello poderá denegar este uso cando se de xeito repetido e ou indefinido, promovendo sempre os principios da Asociación e o seu compromiso coa lingua galega.
          </p>
        </div>
      </section>

      {/* 6. Ámbito temático */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">6. Ámbito temático</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
          CERNA promoverá preferentemente artigos que contribúan á comprensión da realidade galega e do mundo contemporáneo desde unha perspectiva reflexiva e interdisciplinaria.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Poderán abordarse cuestións relacionadas coa filosofía, a historia, a literatura, a lingua, o patrimonio, a universidade, a educación, a economía, o dereito, a política pública, a ciencia, a tecnoloxía, a intelixencia artificial, a cultura, a identidade, Europa ou calquera outro ámbito que resulte conforme coa liña editorial da entidade.
        </p>
        <p className="font-sans text-xs text-charcoal/50 italic mt-4">
          A relación anterior ten carácter meramente orientativo.
        </p>
      </section>

      {/* 7. Estrutura dos artigos */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">7. Estrutura dos artigos</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
          Conforme aos principios expostos, CERNA promoverá o cultivo do artigo breve en todas as súas posibilidades expresivas. A colección aspira a reunir textos con personalidade propia, liberdade formal e unha voz recoñecible, afastándose de modelos excesivamente ríxidos ou uniformes.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Os artigos non deberán limitarse á mera exposición de feitos nin á simple defensa dunha opinión, senón que procurarán desenvolver unha reflexión persoal mediante unha argumentación sólida, unha escrita coidada e unha perspectiva orixinal.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4 mb-4">
          Con todo, por razóns didácticas e co propósito de facilitar a redacción daqueles autores menos familiarizados co xénero, recoméndase, con carácter meramente orientativo, a adopción da estrutura clásica do texto argumentativo ou doutras fórmulas equivalentes. Deste xeito, o texto poderá organizarse do seguinte modo:
        </p>
        <ul className="space-y-3 font-sans text-xl text-charcoal/80 pl-6 list-none">
          <li><strong>a)</strong> Formulación da cuestión ou do problema obxecto de análise.</li>
          <li><strong>b)</strong> Exposición do contexto necesario para a súa comprensión.</li>
          <li><strong>c)</strong> Desenvolvemento da tese principal mediante argumentos suficientemente fundamentados.</li>
          <li><strong>d)</strong> Consideración das posibles obxeccións ou interpretacións alternativas, cando a natureza do asunto o aconselle.</li>
          <li><strong>e)</strong> Conclusión orientada a sintetizar a reflexión realizada e, preferentemente, a abrir novas liñas de pensamento.</li>
        </ul>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Esta estrutura ten carácter orientativo e poderá adaptarse ás particularidades de cada artigo.
        </p>
      </section>

      {/* 8. Extensión */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">8. Extensión</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
          A extensión ordinaria dos artigos situarase entre as 800 e as 1.200 palabras.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          O Consello Editorial poderá admitir textos de maior ou menor extensión cando a natureza da materia así o xustifique.
        </p>
      </section>

      {/* 9. Estilo */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">9. Estilo</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
          Os artigos publicados por CERNA responderán ao xénero do artigo persoal e caracterizaranse pola liberdade de estilo, a personalidade da voz do autor e o coidado da expresión escrita.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Cada texto deberá constituír unha reflexión propia, elaborada desde a experiencia, o coñecemento ou o criterio persoal do seu autor, evitando tanto a mera exposición de información como a reprodución de opinións alleas sen elaboración crítica.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          CERNA non promove un modelo único de escrita. Terán cabida artigos de natureza reflexiva, narrativa, evocadora ou argumentativa, sempre que presenten unidade, coherencia interna e interese intelectual.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          A colección non adoptará, con carácter xeral, as convencións propias das publicacións académicas. O emprego de fontes documentais e referencias bibliográficas terá carácter excepcional e rexerase polo disposto nos artigos seguintes.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          A calidade dun artigo apreciarase pola autenticidade da súa voz, a solidez da reflexión, a elegancia da súa expresión e a capacidade para suscitar o interese do lector.
        </p>
      </section>

      {/* 10. Fontes e referencias */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">10. Fontes e referencias</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
          O xénero do artigo persoal ou de columna non inclúe nin preciso o emprego de fontes documentais, notas a pé de páxina ou outro tipo de aparello crítico. Pola contra, deben ser textos que se interpreten por si mesmos. O protagonismo do artigo corresponde á reflexión do autor e non á reprodución de autoridades alleas.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Cando resulte imprescindible facer referencia a unha obra ou documento, esta integrarase no propio discurso, sen interromper o desenvolvemento da lectura.
        </p>
      </section>

      {/* Pull Quote */}
      <section className="mb-16 px-8 md:px-20 border-l border-r border-gold/30 py-4 text-center">
        <blockquote className="font-serif text-3xl text-charcoal italic leading-relaxed">
          "A identidade gráfica e intelectual define a excelencia de CERNA."
        </blockquote>
      </section>

      {/* 11. Libro de estilo */}
      <section className="mb-16 bg-surface p-10 border border-lines">
        <h2 className="font-serif text-3xl text-charcoal mb-6">11. Libro de estilo:</h2>
        <p className="font-sans text-lg text-charcoal/70 mb-6">
          Co fin de garantir unha identidade editorial común, os artigos observarán o establecido os seguintes criterios formais:
        </p>
        <div className="space-y-4 text-lg font-sans text-charcoal/80">
          <p><strong>a)</strong> O texto redactarase en Times New Roman, corpo 12 pt, con interliñado de 1,5 liñas.</p>
          <p><strong>b)</strong> Os títulos principais escribiranse en negra, corpo 16 pt.</p>
          <p><strong>c)</strong> Os subtítulos, cando existan, escribiranse en negra, corpo 14 pt.</p>
          <p><strong>d)</strong> O corpo do texto presentarase xustificado, sen partición de palabras e sen espazos adicionais entre parágrafos.</p>
          <p><strong>e)</strong> A primeira liña de cada parágrafo irá sangrada 1,25 cm agás a inmediatamente posterior a un título ou subtítulo.</p>
          <p><strong>f)</strong> A negra reservarase para titles e subtítulos, evitando o seu emprego no corpo do texto, salvo casos excepcionais.</p>
          <p><strong>g)</strong> A cursiva empregarase para os títulos de libros, revistas e outras publicacións, para palabras e expresións en lingua estranxeira, latinismos e nos demais supostos previstos polas normas ortotipográficas.</p>
          <p><strong>h)</strong> As citas e referencias bibliográficas axustaranse, con carácter xeral, ás normas establecidas pola 7.ª edición do Publication Manual of the American Psychological Association (APA 7), coas adaptacións ortotipográficas deste libro de estilo. As citas incorporaranse sempre no corpo do texto mediante o sistema autor-data. As citas textuais empregaranse con carácter excepcional e unicamente cando a reprodución literal resulte imprescindible para a comprensión da argumentación, procurando que a reflexión do autor prevaleza sobre a reprodución de textos alleos. Con carácter xeral, non poderán incorporarse máis de tres citas textuais por artigo. As citas breves integraranse entre comiñas, seguidas entre paréntese do apelido do autor, o ano de publicación e, cando proceda, a páxina correspondente. As citas de maior extensión presentaranse en parágrafo independente, sen comiñas e con sangrado. As referencias bibliográficas incluiranse ao final do artigo, baixo o epígrafe «Referencias», ordenadas alfabeticamente conforme aos criterios establecidos pola norma APA 7.</p>
          <p><strong>i)</strong> Non se utilizarán subliñados, cambios de cor, versais integrais con finalidade enfática nin outros recursos tipográficos alleos á identidade editorial de CERNA.</p>
          <p><strong>j)</strong> As comiñas angulares (« ») serán as de uso ordinario. As comiñas dobres (" ") reservaranse para citas dentro doutras citas e as comiñas simples (' ') para casos excepcionais.</p>
          <p><strong>k)</strong> As enumeracións realizaranse preferentemente mediante letras —a), b), c)...— ou mediante guións, evitándose o emprego de viñetas.</p>
          <p><strong>l)</strong> As marxes do documento serán de 2,5 cm en todos os lados e o texto presentarase en formato A4.</p>
        </div>
      </section>

      {/* 12. Avaliación editorial */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">12. Avaliación editorial</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mb-6">
          Na valoración dos artigos o Consello Editorial atenderá especialmente aos seguintes criterios:
        </p>
        <ul className="space-y-3 font-sans text-xl text-charcoal/80 pl-6 list-none mb-6">
          <li><strong>a)</strong> Interese intelectual da proposta.</li>
          <li><strong>b)</strong> Coherencia e solidez da argumentación.</li>
          <li><strong>c)</strong> Orixinalidade da reflexión.</li>
          <li><strong>d)</strong> Corrección lingüística e calidade da expresión escrita.</li>
          <li><strong>e)</strong> Adecuación á liña editorial de CERNA.</li>
          <li><strong>f)</strong> Capacidade do texto para contribuír ao debate público e á formación do pensamento crítico.</li>
        </ul>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mb-4">
          O procedemento de avaliación desenvolverase de conformidade cos dereitos e deberes dos autores e colaboradores establecidos no Regulamento de Réxime Interno do Consello Editorial de CERNA Pensamento ou na disposición que o substitúa.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mb-4">
          Corresponderalle ao membro do Consello Editorial encargado da tramitación do artigo efectuar unha primeira revisión do texto e determinar se reúne as condicións necesarias para a súa presentación á deliberación do Consello Editorial. No exercicio desta función actuará de conformidade co disposto no Regulamento de Réxime Interno e velará polo cumprimento dos criterios establecidos neste libro de estilo.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mb-6">
          Cando o artigo non reúna as condicións necesarias para a súa presentación, observarase o seguinte procedemento obrigatoriamente cando pertenza a un socio e recomendablemente se é un colaborador:
        </p>

        <div className="space-y-6">
          <div className="border border-lines p-6 bg-surface">
            <span className="font-sans text-[10px] text-gold uppercase tracking-widest mb-3 block">a) Revisión Inicial</span>
            <p className="text-lg text-charcoal/80 font-sans leading-relaxed">
              O texto devolverase ao autor acompañado dunha exposición motivada das razóns que xustifican a súa devolución. O membro encargado poderá formular as observacións, suxestións ou correccións que considere oportunas, respectando sempre o sentido e o contido intelectual do artigo. As correccións de natureza ortográfica poderán incorporarse directamente ao documento; as observacións de carácter estilístico, gramatical ou léxico realizaranse preferentemente mediante anotacións. Cando a devolución se fundamente en razóns de contido, estas deberán expresarse de forma clara e suficientemente motivada.
            </p>
          </div>
          <div className="border border-lines p-6 bg-surface">
            <span className="font-sans text-[10px] text-gold uppercase tracking-widest mb-3 block">b) Axustes e Nova Versión</span>
            <p className="text-lg text-charcoal/80 font-sans leading-relaxed">
              Recibidas as observacións, o autor poderá introducir as modificacións que considere oportunas e remitirá unha nova versión ao membro encargado da súa revisión. Se o artigo continuase sen reunir as condicións necesarias para a súa presentación, repetirase o procedemento previsto neste artigo.
            </p>
          </div>
          <div className="border border-lines p-6 bg-surface">
            <span className="font-sans text-[10px] text-gold uppercase tracking-widest mb-3 block">c) Deliberación Final</span>
            <p className="text-lg text-charcoal/80 font-sans leading-relaxed">
              Unha vez considerado apto para a súa deliberación, o artigo incluirase na orde do día da seguinte sesión do Consello Editorial. Se, tras a aplicación do procedemento anterior, o membro encargado continuase considerando que o artigo presentado por un socio non debe ser admitido, someterao igualmente á deliberación do Consello Editorial, que resolverá definitivamente sobre a súa aceptación ou rexeitamento.
            </p>
          </div>
        </div>
      </section>

      {/* 13. Identidade da colección */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">13. Identidade da colección</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
          Os artigos semanais de CERNA constitúen unha colección editorial unitaria e responderán a unha identidade común, tanto na súa presentación formal como na concepción intelectual que inspira a publicación.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          En consecuencia, compartirán unha identidade gráfica coherente, criterios editoriais uniformes e un mesmo nivel de esixencia intelectual e literaria.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          A identidade da colección non se fundamentará exclusivamente na súa aparencia visual, senón tamén nunha forma recoñecible de comprender a función da cultura, de exercer o pensamento crítico e de cultivar unha escrita persoal, rigorosa e coidada.
        </p>
      </section>

      {/* 14. Consideración derradeira */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-charcoal mb-6 border-b border-lines pb-2">14. Consideración derradeira</h2>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed">
          Os artigos semanais constitúen a manifestación máis continuada da actividade intelectual de CERNA e un dos principais instrumentos para o cumprimento dos seus fins fundacionais.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          A súa finalidade non consiste unicamente en ofrecer unha resposta á actualidade, senón en contribuír á formación dun espazo estable de reflexión crítica, promovendo unha cultura do pensamento fundada no rigor intelectual, no diálogo e na excelencia editorial.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Mediante esta colección, CERNA aspira a consolidar unha comunidade de autores e lectores comprometidos coa creación, difusión e desenvolvemento do pensamento galego contemporáneo.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Os autores conservarán a titularidade dos dereitos de propiedade intelectual sobre os seus artigos. Sen prexuízo do anterior, autorizarán a CERNA PENSAMENTO para a súa publicación e difusión a través dos medios propios da entidade, así como para a súa eventual incorporación a antoloxías, compilacións ou outras publicacións editadas baixo o selo editorial CERNA PENSAMENTO, en formato físico ou dixital, logo de comunicación ao autor e con pleno respecto dos seus dereitos.
        </p>
        <p className="font-sans text-xl text-charcoal/80 leading-relaxed mt-4">
          Nas reedicións ou publicacións posteriores realizadas polos seus autores deberá facerse constar que a primeira publicación do texto tivo lugar en CERNA Pensamento.
        </p>
      </section>
    </>
  );
}
