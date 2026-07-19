-- Seed para inyectar 10 artículos falsos con formato HTML rico
-- Distribuido equitativamente entre los 4 autores.

INSERT INTO public.articulos (slug, titulo, contenido, imagen_url, autor_id, estado)
VALUES 
-- DIEGO ARAUJO (Economía)
(
  'el-mercado-invisible',
  'El mercado invisible: Más allá de la oferta y demanda',
  'La economía neoclásica nos ha enseñado a ver el mercado como una balanza perfecta. <strong>Pero la neutralidad del mercado es una ilusión óptica.</strong> 
  
  <blockquote>"La economía no es una ciencia de números, sino de poder."</blockquote>
  
  <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80" alt="Bolsa de valores" />
  
  En la época del capitalismo tardío, las fuerzas que mueven los precios ya no son solo consumidores racionales, sino algoritmos de alta frecuencia que desvinculan el valor real del valor nominal.',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
  'publicado'
),
(
  'la-devaluacion-del-tiempo',
  'La devaluación del tiempo en la era de la hiperproductividad',
  'El tiempo se ha convertido en la mercancía más barata para las corporaciones y la más cara para los individuos. <strong>Hemos internalizado la métrica de la productividad como medida de nuestra propia valía humana.</strong>
  
  <img src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80" alt="Relojes" />
  
  <blockquote>"El tiempo libre ya no es descanso, es simplemente preparación para volver a producir."</blockquote>
  
  Si no recuperamos nuestra soberanía temporal, la economía verde no servirá de nada, porque el primer recurso agotado seremos nosotros mismos.',
  'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80',
  'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
  'publicado'
),
(
  'crecimiento-infinito-planeta-finito',
  'Crecimiento infinito en un planeta finito',
  'La obsesión por el crecimiento del PIB es el dogma central de nuestra época. <strong>Es matemáticamente imposible sostener un crecimiento infinito en un ecosistema cerrado.</strong>
  
  <blockquote>"Quien crea que el crecimiento exponencial puede continuar eternamente en un mundo finito es un loco o un economista." — Kenneth Boulding</blockquote>
  
  <img src="https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80" alt="Naturaleza y economía" />
  
  La economía ecológica no es una subdisciplina, debería ser la base fundacional de cualquier teoría económica del siglo XXI.',
  'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80',
  'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
  'publicado'
),

-- HECTOR GONZALEZ (Física)
(
  'el-reloj-y-la-entropia',
  'El reloj y la entropía: Por qué el pasado no vuelve',
  'La física nos enseña que las ecuaciones fundamentales son simétricas respecto al tiempo. <strong>Sin embargo, nuestra experiencia es puramente asimétrica.</strong>
  
  <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80" alt="Universo" />
  
  <blockquote>"La entropía es la flecha del tiempo." — Arthur Eddington</blockquote>
  
  El desorden siempre aumenta. Esa es la tragedia y la belleza de la termodinámica: el universo marcha inevitablemente hacia su propio enfriamiento térmico.',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
  'publicado'
),
(
  'limites-del-modelo-estandar',
  'Los límites del Modelo Estándar y la materia oscura',
  'Hemos construido el edificio teórico más preciso de la historia de la ciencia. <strong>Pero solo describe el 5% del universo.</strong>
  
  <blockquote>"La física de partículas está en crisis, pero es una crisis maravillosa."</blockquote>
  
  <img src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80" alt="Galaxia" />
  
  La materia y la energía oscura siguen siendo los grandes fantasmas que atormentan a nuestros detectores. Quizás necesitamos una nueva revolución conceptual, no solo aceleradores más grandes.',
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
  'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
  'publicado'
),

-- DENIS FERNÁNDEZ (Derecho)
(
  'la-ley-como-herramienta',
  'La ley como herramienta de poder',
  'Concebimos la justicia como una entidad ciega y equilibrada. <strong>Pero la redacción de las leyes nunca es un proceso neutral.</strong>
  
  <img src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=80" alt="Mazo de juez" />
  
  <blockquote>"El derecho, en su majestuosa igualdad, prohíbe tanto a ricos como a pobres dormir bajo los puentes." — Anatole France</blockquote>
  
  La desigualdad estructural se codifica en el BOE mucho antes de llegar a los tribunales. El formalismo jurídico a menudo sirve como escudo para las injusticias materiales.',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=80',
  'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
  'publicado'
),
(
  'derechos-humanos-era-digital',
  'Derechos humanos en la era de los algoritmos',
  'La extracción masiva de datos ha creado un nuevo escenario donde los derechos civiles están desprotegidos. <strong>Nuestra jurisprudencia es analógica en un mundo digital.</strong>
  
  <blockquote>"El código es ley." — Lawrence Lessig</blockquote>
  
  <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80" alt="Código Matrix" />
  
  Cuando un algoritmo deniega una hipoteca o filtra un currículum, ¿a quién le reclamamos el derecho a la tutela judicial efectiva?',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
  'publicado'
),

-- ANXO PÉREZ (Humanidades)
(
  'la-poetica-del-silencio',
  'La poética del silencio en la literatura del desarraigo',
  'En la poesía del siglo XX, lo no dicho adquiere tanto peso como la palabra escrita. <strong>El silencio es la última forma de resistencia frente al ruido totalitario.</strong>
  
  <blockquote>"Hay golpes en la vida, tan fuertes... ¡Yo no sé!" — César Vallejo</blockquote>
  
  <img src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80" alt="Libro antiguo" />
  
  Leer los espacios en blanco de la posguerra es entender la historia que no cupo en los manuales oficiales.',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  'publicado'
),
(
  'memoria-y-olvido',
  'La trinchera de la memoria y la anestesia del olvido',
  'Una sociedad sin memoria es un cuerpo sin sistema inmunológico. <strong>Olvidar no es sanar, es simplemente posponer la infección.</strong>
  
  <img src="https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80" alt="Monumento histórico" />
  
  <blockquote>"Quien controla el pasado controla el futuro." — George Orwell</blockquote>
  
  La memoria histórica no busca revancha, sino suturar una herida que la amnesia institucionalizada solo ha logrado infectar.',
  'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  'publicado'
),
(
  'el-fin-de-la-narrativa-lineal',
  'El declive de la narrativa lineal y la fragmentación moderna',
  'Ya no leemos de principio a fin porque tampoco vivimos de principio a fin. <strong>Nuestra atención ha sido parcelada por la tecnología.</strong>
  
  <blockquote>"La forma de la novela moderna refleja la angustia de un mundo fragmentado."</blockquote>
  
  <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80" alt="Estrellas montaña" />
  
  Recuperar la capacidad de leer un texto largo es, hoy en día, un acto de rebelión subversiva.',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  'publicado'
)
ON CONFLICT (slug) DO NOTHING;
