-- Ensayos de prueba: un borrador y dos artículos publicados
-- Ejecutar en el editor SQL de Supabase
-- Reemplazar 'b2b2b2b2-...' por un UUID real de la tabla perfiles

DO $$
DECLARE
  autor_id UUID := 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';
BEGIN

-- 1. Borrador
INSERT INTO public.articulos (titulo, subtitulo, slug, contenido, imagen_url, tematicas, estado, autor_id)
VALUES (
  'Fragmentos sobre el Tiempo Perdido',
  'Notas inconclusas sobre la memoria, el olvido y la escritura como resistencia',
  'fragmentos-tiempo-perdido',
  '<p>Escribir es una forma de hacer durar lo que está destinado a desaparecer. Cada frase es un intento de fijar el instante antes de que se disuelva en el río del olvido.</p>
<p>No sé si esto será un ensayo o una carta. Quizás ambas cosas. La frontera entre un género y otro se borra cuando quien escribe ya no sabe a quién se dirige.</p>
<blockquote><p>«El tiempo no pasa, nosotros pasamos a través de él como barcos en la niebla».</p></blockquote>
<p>He estado leyendo a Proust otra vez. Me sorprende que, a pesar de los años, ciertos párrafos tengan el mismo efecto que la primera vez: una contracción en el pecho, la sensación de que alguien más ha vivido lo que creía exclusivamente mío.</p>
<p>La madeleine no es un pastel. Es una metáfora de todo aquello que regresa sin ser llamado. La memoria involuntaria es la única verdadera; la otra, la que ejercemos a voluntad, es apenas un ejercicio de archivo.</p>
<img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80" alt="Un reloj de arena sobre libros antiguos">
<p>Me pregunto si la escritura no será, al final, un intento desesperado de fabricar madeleines artificiales. Construir con palabras el dispositivo que desencadene, en otro, el recuerdo de lo que nunca vivió.</p>',
  'https://images.unsplash.com/photo-1505663911033-0f2c9195e064?w=1200&q=80',
  ARRAY['TIEMPO', 'MEMORIA', 'ESCRITURA', 'PROUST'],
  'borrador',
  autor_id
);

-- 2. Artículo publicado: Sobre la Lectura
INSERT INTO public.articulos (titulo, subtitulo, slug, contenido, imagen_url, tematicas, estado, autor_id)
VALUES (
  'El Libro como Lugar',
  'Por qué leer no es una actividad sino una forma de habitar el mundo',
  'el-libro-como-lugar',
  '<p>Un libro no es un objeto que se sostiene en las manos. Es un espacio en el que se entra. Cuando abrimos una novela, cruzamos un umbral: el ruido de la calle se apaga, el tiempo lineal se suspende, y de pronto estamos en otra parte.</p>
<p>Los grandes lectores lo saben: hay libros que tienen la textura de una habitación recordada. Uno no recuerda solo la historia, sino la atmósfera, la luz, la temperatura de aquellas páginas. Leer es, en ese sentido, una experiencia arquitectónica.</p>
<blockquote><p>«El hogar no es donde vives, es lo que lees» — Alberto Manguel</p></blockquote>
<p>En la era digital, esta dimensión espacial de la lectura se ha erosionado. Leemos en pantallas que son todas iguales, fragmentos que aparecen y desaparecen sin dejar huella. Pero el libro de papel persiste como un territorio que el lector puede habitar con el cuerpo: el peso en las manos, el olor del papel, el sonido de la página al girar.</p>
<img src="https://images.unsplash.com/photo-1526243742383-b9e3632b0f7e?w=800&q=80" alt="Libros apilados sobre una mesa">
<p>No se trata de nostalgia. Se trata de reconocer que ciertas experiencias requieren un soporte material para desplegarse por completo. La lectura profunda no es solo un proceso cognitivo; es un acontecimiento que involucra los sentidos, el tiempo y el espacio.</p>
<p>Cada libro que hemos amado es una habitación a la que podemos volver. Y volver a un libro es, como volver a una casa de la infancia, descubrir que el lugar ha cambiado porque nosotros hemos cambiado.</p>
<blockquote><p>«Un clásico es un libro que nunca termina de decir lo que tiene que decir» — Italo Calvino</p></blockquote>
<p>Tal vez por eso seguimos leyendo. No para aprender, no para informarnos, sino para tener un lugar al que regresar cuando el mundo exterior se vuelve inhabitable.</p>',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200&q=80',
  ARRAY['LECTURA', 'LITERATURA', 'LIBROS', 'ATENCIÓN'],
  'publicado',
  autor_id
);

-- 3. Artículo publicado: Ética y Técnica
INSERT INTO public.articulos (titulo, subtitulo, slug, contenido, imagen_url, tematicas, estado, autor_id)
VALUES (
  'Ética y Técnica: El Dilema de la Herramienta',
  'Sobre cómo la tecnología nos configura tanto como nosotros a ella',
  'etica-y-tecnica',
  '<p>Toda herramienta es una prolongación del cuerpo. El martillo extiende el brazo, la rueda extiende la pierna, el libro extiende la memoria. Pero hay un momento en que la herramienta deja de ser extensión y se convierte en condición: no usamos la tecnología, habitamos en ella.</p>
<p>Este desplazamiento es el núcleo del problema ético de la técnica. Mientras la herramienta fue un instrumento que podíamos dejar y retomar a voluntad, la cuestión era simplemente de uso prudente. Pero cuando la herramienta se vuelve entorno —como la electricidad, como internet, como los algoritmos que organizan nuestra percepción de lo real—, la pregunta ya no es cómo la usamos sino cómo nos usa.</p>
<blockquote><p>«No vemos el mundo como es, lo vemos como somos. Y hoy, lo somos a través de las tecnologías que nos configuran».</p></blockquote>
<p>Heidegger advirtió sobre el peligro de la técnica moderna: su tendencia a reducir todo —incluido el ser humano— a recurso disponible, a stock explotable. El «fondo de reserva» del que hablaba no es otra cosa que la reducción del mundo a datos, de la experiencia a información, de la persona a perfil.</p>
<img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80" alt="Circuito integrado con luces">
<p>Setenta años después, su diagnóstico se ha cumplido más allá de lo que él mismo pudo imaginar. Nuestra vida cotidiana está mediada por sistemas que no controlamos y que apenas comprendemos. Los algoritmos no nos recomiendan contenido: nos predicen, nos anticipan, nos cierran en un bucle de preferencias calculadas.</p>
<p>Frente a esto, no se trata de rechazar la tecnología —sería tan ingenuo como imposible—, sino de recuperar una relación crítica con ella. La pregunta ética fundamental de nuestro tiempo no es «qué podemos hacer», sino «qué debemos dejar de hacer».</p>
<blockquote><p>«La verdadera libertad no consiste en hacer lo que se quiere, sino en poder elegir lo que se hace. Y para elegir, primero hay que comprender».</p></blockquote>
<p>Necesitamos una nueva ascesis: la disciplina de apagar la pantalla, de demorar la respuesta, de preservar espacios de silencio digital donde el pensamiento pueda desplegarse sin interferencia. No por romanticismo, sino por supervivencia intelectual.</p>
<p>La técnica no es neutral. Cada herramienta trae consigo una forma de vida, un modo de relación con el mundo y con los otros. Elegir la herramienta es, en última instancia, elegir qué tipo de ser humano queremos ser.</p>',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80',
  ARRAY['TECNOLOGÍA', 'ÉTICA', 'FILOSOFÍA', 'HEIDEGGER'],
  'publicado',
  autor_id
);

END $$;
