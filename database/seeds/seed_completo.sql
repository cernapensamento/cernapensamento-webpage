-- =======================================================
-- 1. SEED_ESCRITORES - Creación de Escritores y Lectores de Prueba
-- =======================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  ids UUID[] := ARRAY[
    'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
    'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
    'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4'
  ];
  emails TEXT[] := ARRAY[
    'diegoaraujo@cernapensamento.org',
    'hectorgonzalez@cernapensamento.org',
    'denisfernandez@cernapensamento.org',
    'anxoperez@cernapensamento.org'
  ];
  nombres TEXT[] := ARRAY[
    'Diego Araujo',
    'Hector González',
    'Denis Fernández',
    'Anxo Pérez'
  ];
  lectorIds UUID[] := ARRAY[
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
    'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3',
    'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4'
  ];
  lectorEmails TEXT[] := ARRAY[
    'lector1@cernapensamento.org',
    'lector2@cernapensamento.org',
    'lector3@cernapensamento.org',
    'lector4@cernapensamento.org'
  ];
  lectorNombres TEXT[] := ARRAY[
    'Lucía Méndez',
    'Martín Ríos',
    'Clara Huerta',
    'Santiago Gil'
  ];
  i INT;
BEGIN
  -- Escritores
  FOR i IN 1..array_length(ids, 1) LOOP
    DELETE FROM auth.users WHERE email = emails[i];

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      ids[i],
      'authenticated',
      'authenticated',
      emails[i],
      crypt('123456', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('nombre', nombres[i]),
      now(),
      now(),
      '', '', '', ''
    );

    UPDATE public.perfiles
    SET rol = 'escritor', nombre = nombres[i]
    WHERE id = ids[i];
  END LOOP;

  -- Lectores
  FOR i IN 1..array_length(lectorIds, 1) LOOP
    DELETE FROM auth.users WHERE email = lectorEmails[i];

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      lectorIds[i],
      'authenticated',
      'authenticated',
      lectorEmails[i],
      crypt('123456', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('nombre', lectorNombres[i]),
      now(),
      now(),
      '', '', '', ''
    );

    UPDATE public.perfiles
    SET nombre = lectorNombres[i]
    WHERE id = lectorIds[i];
  END LOOP;
END $$;


-- =======================================================
-- 2. ASEGURAR COLUMNAS FALTANTES
-- =======================================================
ALTER TABLE public.articulos ADD COLUMN IF NOT EXISTS subtitulo TEXT;
ALTER TABLE public.articulos ADD COLUMN IF NOT EXISTS tematicas TEXT[] DEFAULT '{}';


-- =======================================================
-- 3. SEED_ARTICULOS - Inyección de Artículos Falsos Largos
-- =======================================================

INSERT INTO public.articulos (slug, titulo, subtitulo, contenido, imagen_url, autor_id, estado, tematicas)
VALUES 
-- DIEGO ARAUJO (Economía)
(
  'el-mercado-invisible',
  'El mercado invisible',
  'Más allá de la oferta y demanda: cómo el capitalismo tardío reconfigura nuestro deseo',
  '<p>La economía neoclásica nos ha enseñado a ver el mercado como una balanza perfecta, un mecanismo casi natural que se autorregula para alcanzar un equilibrio óptimo. <strong>Pero la neutralidad del mercado es una ilusión óptica.</strong> No existe un espacio puro de intercambio; cada transacción está atravesada por dinámicas de poder invisibles pero omnipresentes que moldean no sólo lo que compramos, sino cómo estructuramos nuestras vidas.</p>

  <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80" alt="Bolsa de valores" />

  <p>En la época del capitalismo tardío, las fuerzas que mueven los precios ya no son solo consumidores racionales tomando decisiones calculadas. Hoy en día, son algoritmos de alta frecuencia, especulación sobre derivados financieros y plataformas extractivistas las que desvinculan el valor real del valor nominal. Nos encontramos en una paradoja donde la abundancia de bienes convive con una profunda precariedad existencial y material para la mayoría de los productores.</p>

  <blockquote>"La economía no es una ciencia de números, sino de poder. Es el estudio de cómo organizamos nuestra interdependencia."</blockquote>

  <p>Debemos abandonar la idea de que la economía es un ente autónomo que obedece a leyes inmutables como la gravedad. Por el contrario, es una construcción social, política y cultural. Para recuperar la agencia sobre nuestras sociedades, necesitamos democratizar el debate económico y atrevernos a proponer alternativas estructurales que pongan la vida, y no la acumulación de capital, en el centro del escenario.</p>',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
  'publicado',
  ARRAY['Economía', 'Capitalismo', 'Sociedad']
),
(
  'la-devaluacion-del-tiempo',
  'La devaluación del tiempo',
  'La era de la hiperproductividad y el robo de la soberanía temporal',
  '<p>El tiempo se ha convertido en la mercancía más barata para las corporaciones y la más cara para los individuos. Desde la revolución industrial, el reloj ha dictado el ritmo de la vida, pero en la actualidad hemos llegado a un extremo sin precedentes. <strong>Hemos internalizado la métrica de la productividad como medida de nuestra propia valía humana</strong>, hasta el punto de sentir culpa cuando simplemente descansamos.</p>

  <img src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80" alt="Relojes antiguos" />

  <p>La digitalización prometía liberarnos del trabajo repetitivo y regalarnos tiempo de ocio. Sin embargo, el resultado ha sido el opuesto: la barrera entre la oficina y el hogar se ha desintegrado. El trabajador moderno es un nodo siempre conectado, disponible 24/7 para responder correos o mensajes, convirtiendo cada minuto del día en una fracción de tiempo potencialmente monetizable. Esta es la verdadera tragedia del modelo actual.</p>

  <blockquote>"El tiempo libre ya no es descanso, es simplemente preparación para volver a producir. Nos hemos convertido en los gestores exhaustos de nuestra propia fatiga."</blockquote>

  <p>Si no recuperamos nuestra soberanía temporal, ninguna reforma económica profunda será posible. La economía verde o circular no servirá de nada si el paradigma subyacente sigue siendo el de la aceleración constante, porque el primer recurso agotado seremos nosotros mismos. Reivindicar el derecho al aburrimiento, a la lentitud y al descanso improductivo es, hoy en día, el acto de rebelión económica más urgente.</p>',
  'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80',
  'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
  'publicado',
  ARRAY['Filosofía del Trabajo', 'Productividad', 'Economía']
),
(
  'crecimiento-infinito-planeta-finito',
  'Crecimiento infinito, planeta finito',
  'La imposibilidad matemática del paradigma económico actual',
  '<p>La obsesión por el crecimiento constante del PIB es el dogma central y la religión secular de nuestra época. Ningún gobierno se atreve a proponer un escenario donde la economía se estabilice o decrezca, temiendo el abismo de la recesión. Sin embargo, <strong>es matemáticamente y físicamente imposible sostener un crecimiento infinito en un ecosistema cerrado.</strong></p>

  <p>La narrativa dominante sugiere que podemos "desacoplar" el crecimiento económico del consumo de recursos materiales a través de la tecnología y la eficiencia. Promesas de economía verde, energías renovables y mercados de carbono intentan pintar de sostenibilidad un sistema que estructuralmente requiere devorar su entorno para sobrevivir.</p>

  <img src="https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80" alt="Naturaleza enfrentada a la civilización" />

  <blockquote>"Quien crea que el crecimiento exponencial puede continuar eternamente en un mundo finito es un loco o un economista." — Kenneth Boulding</blockquote>

  <p>La transición hacia un modelo post-crecimiento no es una opción estética, sino un imperativo biológico. Necesitamos rediseñar nuestras instituciones financieras, los sistemas de pensiones y las métricas de bienestar para que no dependan del crecimiento perpetuo. La economía ecológica no debe ser tratada como una subdisciplina marginal, sino como la base fundacional de cualquier teoría económica que pretenda ser relevante en el siglo XXI.</p>',
  'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80',
  'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
  'publicado',
  ARRAY['Ecología', 'Crecimiento', 'Sostenibilidad']
),

-- HECTOR GONZALEZ (Física)
(
  'el-reloj-y-la-entropia',
  'El reloj y la entropía',
  'Por qué el pasado no vuelve y la flecha del tiempo',
  '<p>La física nos enseña algo profundamente contraintuitivo: las ecuaciones fundamentales del universo (desde Newton hasta la mecánica cuántica) son perfectamente simétricas respecto al tiempo. En el papel, el futuro y el pasado son indistinguibles. <strong>Sin embargo, nuestra experiencia humana es puramente asimétrica.</strong> Sentimos el fluir del tiempo, recordamos el pasado pero no el futuro, y observamos cómo los vasos de cristal se rompen, pero nunca vemos los pedazos unirse de nuevo espontáneamente.</p>

  <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80" alt="Universo estrellado" />

  <p>Esta contradicción se resuelve a través de la Segunda Ley de la Termodinámica, que establece que la entropía (el grado de desorden) de un sistema aislado siempre tiende a aumentar. Es esta tendencia estadística la que dota al universo de una dirección. No es que las leyes fundamentales prohíban que un huevo roto vuelva a armarse; es simplemente que la probabilidad de que las moléculas se organicen de esa manera es tan abismalmente baja que jamás ocurrirá en la edad del universo.</p>

  <blockquote>"La entropía es la flecha del tiempo. Sin ella, el universo sería un escenario estático sin historia ni memoria." — Arthur Eddington</blockquote>

  <p>El desorden siempre aumenta. Esa es la tragedia y la belleza intrínseca de la termodinámica. Nuestra misma existencia biológica, nuestro orden interno, se mantiene temporalmente a expensas de aumentar la entropía a nuestro alrededor. Al final, el universo marcha inevitablemente hacia su propio enfriamiento térmico, un estado final de equilibrio aburrido donde nada nuevo puede suceder. Hasta entonces, vivimos en la gloriosa turbulencia de su decadencia.</p>',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
  'publicado',
  ARRAY['Física', 'Cosmología', 'Termodinámica']
),
(
  'limites-del-modelo-estandar',
  'Los límites del Modelo Estándar',
  'La materia oscura y el universo que no podemos ver',
  '<p>A lo largo del siglo XX, hemos construido el edificio teórico más preciso y elegante de la historia de la ciencia: el Modelo Estándar de la física de partículas. Con él, podemos predecir el comportamiento de los electrones y los quarks con una exactitud equivalente a medir la distancia entre Nueva York y París con un margen de error del grosor de un cabello humano. <strong>Pero a pesar de su triunfo abrumador, el Modelo Estándar sólo describe el 5% del universo.</strong></p>

  <p>El otro 95% está compuesto por entidades oscuras: la materia oscura y la energía oscura. Sabemos que están ahí por sus abrumadores efectos gravitacionales. Observamos cómo la materia oscura mantiene unidas a las galaxias que rotan demasiado rápido, y cómo la energía oscura empuja al universo a expandirse a un ritmo cada vez más acelerado. Sin embargo, no tenemos ni idea de qué partículas o campos las componen.</p>

  <img src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80" alt="Galaxia y polvo estelar" />

  <blockquote>"La física de partículas está en crisis, pero es una crisis maravillosa que precede a una nueva iluminación."</blockquote>

  <p>Durante décadas, hemos construido detectores subterráneos enterrados en minas de oro y aceleradores gigantescos con la esperanza de capturar un escurridizo "WIMP" (Partícula Masiva de Interacción Débil), el principal candidato a materia oscura. Hasta ahora, el resultado ha sido un silencio ensordecedor. Quizás estamos buscando en el lugar equivocado. Tal vez no necesitamos colisionadores más grandes, sino una revolución conceptual completa sobre la gravedad a grandes escalas. Sea cual sea la respuesta, estamos ante el abismo de un nuevo renacimiento científico.</p>',
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
  'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
  'publicado',
  ARRAY['Física Cuántica', 'Astronomía', 'Ciencia']
),

-- DENIS FERNÁNDEZ (Derecho)
(
  'la-ley-como-herramienta',
  'La ley como herramienta de poder',
  'Desmontando el mito de la neutralidad jurídica en el Estado moderno',
  '<p>Concebimos la justicia, simbolizada en la clásica estatua con los ojos vendados, como una entidad ciega y equilibrada. Desde la Revolución Francesa, el mito fundacional de nuestras democracias es la igualdad de todos ante la ley. <strong>Pero la redacción de las leyes, su interpretación y su aplicación empírica nunca han sido procesos neutrales.</strong> Detrás del lenguaje aséptico del derecho se esconden batallas históricas por la hegemonía y la distribución de recursos.</p>

  <p>El formalismo jurídico a menudo exige tratar casos profundamente diferentes con la misma vara de medir, ignorando las desigualdades estructurales de partida. Un sistema penal hipertrofiado para perseguir delitos contra la propiedad privada choca frontalmente con la laxitud procedimental a la hora de fiscalizar grandes fraudes fiscales o delitos de cuello blanco. La ley, lejos de ser un árbitro imparcial, frecuentemente opera como un mecanismo de estabilización del status quo.</p>

  <img src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=80" alt="Mazo de juez y códigos" />

  <blockquote>"El derecho, en su majestuosa igualdad, prohíbe tanto a ricos como a pobres dormir bajo los puentes, mendigar por las calles y robar pan." — Anatole France</blockquote>

  <p>La desigualdad estructural se codifica en los Boletines Oficiales del Estado mucho antes de que un conflicto llegue a los tribunales. Para que el derecho sirva verdaderamente como herramienta de emancipación ciudadana, es necesario adoptar un enfoque crítico materialista que reconozca que las normas son productos históricos moldeables. De lo contrario, seguiremos confundiendo la legalidad técnica con la justicia social.</p>',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=80',
  'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
  'publicado',
  ARRAY['Derecho', 'Desigualdad', 'Poder']
),
(
  'derechos-humanos-era-digital',
  'Derechos humanos en la era digital',
  'La jurisprudencia analógica ante el avance de los algoritmos',
  '<p>La extracción masiva de datos y el auge del aprendizaje automático han creado un nuevo escenario sociopolítico donde los derechos civiles tradicionales se encuentran profundamente desprotegidos. <strong>Nuestra jurisprudencia actual es un software obsoleto de la era industrial intentando gobernar un mundo de inteligencias sintéticas.</strong> El paradigma clásico del consentimiento individual ya no sirve cuando la minería de datos ocurre a escala poblacional y de forma inferencial.</p>

  <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80" alt="Líneas de código tipo Matrix" />

  <p>Hoy en día, las decisiones que afectan nuestras vidas de forma drástica (la aprobación de una hipoteca, la criba de un currículum para un puesto de trabajo, o la asignación de ayuda gubernamental) están siendo delegadas a algoritmos de caja negra. Estos sistemas, entrenados con datos históricos, tienden a perpetuar e incluso exacerbar los sesgos de raza, género y clase que ya existían en la sociedad, envolviéndolos bajo una pátina de supuesta objetividad matemática.</p>

  <blockquote>"El código es ley. La arquitectura de internet es política." — Lawrence Lessig</blockquote>

  <p>Cuando un modelo predictivo decide nuestro destino, ¿a quién le reclamamos el derecho fundamental a la tutela judicial efectiva y a una explicación transparente? El nuevo horizonte del derecho debe pasar por crear un marco constitucional de los derechos digitales. Necesitamos auditorías algorítmicas obligatorias, el derecho a no ser perfilado automáticamente, y recuperar espacios de soberanía frente a la privatización absoluta del espacio público digital.</p>',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
  'publicado',
  ARRAY['Derecho Digital', 'Privacidad', 'Tecnología']
),

-- ANXO PÉREZ (Humanidades)
(
  'la-poetica-del-silencio',
  'La poética del silencio en la literatura',
  'Entender el desarraigo y la resistencia a través de lo no dicho',
  '<p>En la poesía y narrativa de la segunda mitad del siglo XX, especialmente en la literatura europea de posguerra, lo no dicho adquiere tanto peso como la palabra escrita. Ante el trauma indecible de los conflictos mundiales y el horror de los totalitarismos, el lenguaje convencional se reveló insuficiente. <strong>El silencio se convirtió en la última forma de resistencia frente al ruido ensordecedor de la propaganda oficial.</strong></p>

  <p>Poetas como Paul Celan o César Vallejo llevaron el lenguaje al límite de su propia fractura. Sus versos están poblados de elipsis, de pausas forzadas, de palabras rotas. En estos silencios habitan los desaparecidos, los exiliados, aquellos cuyas voces fueron arrebatadas por la maquinaria del estado. El espacio en blanco de la página deja de ser un mero contenedor para convertirse en un participante activo del poema.</p>

  <img src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80" alt="Libro antiguo y hojas" />

  <blockquote>"Hay golpes en la vida, tan fuertes... ¡Yo no sé! Golpes como del odio de Dios." — César Vallejo</blockquote>

  <p>Leer los huecos de la literatura del desarraigo es un ejercicio doloroso pero necesario para entender la historia que no cupo en los manuales oficiales. Nos obliga como lectores a detenernos, a habitar la incomodidad de lo inacabado. En un presente caracterizado por la sobreproducción de contenido trivial, regresar a la austeridad rigurosa del poema es quizá la única forma de volver a dar verdadero significado al acto de nombrar las cosas.</p>',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  'publicado',
  ARRAY['Literatura', 'Poesía', 'Memoria']
),
(
  'memoria-y-olvido',
  'La trinchera de la memoria y la anestesia',
  'El peligro del olvido institucionalizado y la cura del recuerdo colectivo',
  '<p>Una sociedad sin memoria colectiva es comparable a un organismo biológico sin sistema inmunológico: incapaz de reconocer el peligro cuando vuelve a presentarse. Las políticas de reconciliación basadas en hacer "borrón y cuenta nueva" asumen falsamente que el paso del calendario cura las fracturas sociales. <strong>Pero olvidar no es sanar, es simplemente posponer la infección hacia las futuras generaciones.</strong></p>

  <img src="https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80" alt="Piedra con inscripciones, monumento" />

  <p>La amnesia impuesta desde las altas instituciones gubernamentales rara vez se produce por un deseo genuino de paz; suele ser un mecanismo de supervivencia para mantener las estructuras de poder de aquellos que se beneficiaron de las injusticias del pasado. La verdadera memoria histórica no es un acto de arqueología vengativa, sino un ejercicio profiláctico necesario para consolidar la democracia en el presente.</p>

  <blockquote>"Quien controla el pasado controla el futuro. Quien controla el presente controla el pasado." — George Orwell</blockquote>

  <p>Desenterrar las historias de los vencidos, restaurar la dignidad de las víctimas y nombrar a los responsables es el único antídoto contra el relativismo moral. La trinchera de la memoria es el lugar desde el cual defendemos que el dolor ajeno no prescribe. Una sociedad verdaderamente madura es aquella que es capaz de mirarse al espejo, incluyendo sus cicatrices más terribles, sin apartar la mirada ni recurrir a fábulas condescendientes.</p>',
  'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  'publicado',
  ARRAY['Historia', 'Memoria', 'Sociedad']
),
(
  'el-fin-de-la-narrativa-lineal',
  'El declive de la narrativa lineal moderna',
  'La fragmentación del yo frente a la tecnología de la hiperconexión',
  '<p>La forma en que consumimos relatos ha sufrido una metamorfosis radical. Ya no leemos novelas clásicas de principio a fin, porque tampoco vivimos nuestras vidas con esa coherencia victoriana. <strong>Nuestra atención ha sido minuciosamente parcelada y empaquetada por la tecnología del scroll infinito.</strong> El resultado no es sólo un cambio en el soporte físico de la lectura, sino una mutación cognitiva que altera nuestra percepción misma del tiempo y del "yo".</p>

  <p>La novela decimonónica ofrecía la ilusión reconfortante de que el mundo tenía un orden, un sentido causa-efecto claro y un desenlace resolutivo. En contraste, las obras más significativas de la modernidad y posmodernidad han renunciado a la omnisciencia para abrazar narradores poco fiables, tramas corales y cronologías rotas. El caos estructural de estas obras es el espejo de una época donde la verdad compartida se ha desintegrado en miles de nichos digitales aislados.</p>

  <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80" alt="Montaña bajo las estrellas" />

  <blockquote>"La forma fragmentada de la novela moderna no es un capricho estilístico, sino el reflejo sincero de la angustia de vivir en un mundo desprovisto de metarrelatos."</blockquote>

  <p>Ante la tiranía de la inmediatez y la saturación de imágenes efímeras, recuperar la capacidad de leer un texto largo y complejo se ha convertido en un acto de resistencia contracultural. Requiere paciencia, aislamiento temporal voluntario y una tolerancia a la incertidumbre. Volver al libro, a la obra que demanda nuestra entrega total sin recompensas dopamínicas instantáneas, es hoy una de las pocas vías de escape de nuestra prisión algorítmica.</p>',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  'publicado',
  ARRAY['Literatura', 'Narrativa', 'Tecnología']
)
ON CONFLICT (slug) DO NOTHING;
