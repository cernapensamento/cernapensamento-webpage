-- Tres artículos de Diego Araujo sobre economía
-- Ejecutar en el editor SQL de Supabase

DO $$
DECLARE
  autor_id UUID := 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1';
BEGIN

-- 1
INSERT INTO public.articulos (titulo, subtitulo, slug, contenido, imagen_url, tematicas, estado, autor_id)
VALUES (
  'El Precio Invisible: Externalidades y la Deuda que No Vemos',
  'Sobre las consecuencias económicas que nadé contabiliza y que todos pagamos',
  'el-precio-invisible',
  '<p>Cuando compramos un producto, pagamos su precio de mercado. Pero ese precio rara vez cuenta toda la historia. <em>Detrás de cada bien hay un rastro de costes que no aparecen en el ticket</em>: el carbono emitido para producirlo, el agua contaminada en su fabricación, la salud deteriorada de quienes lo ensamblaron.</p>
<p>Los economistas llaman a esto <strong>externalidades</strong>. Son los efectos de una transacción que recaen sobre terceros que no participaron en ella. Y son, quizás, el fallo más profundo del mecanismo de precios.</p>
<blockquote><p>«El mercado es un inventario extraordinariamente eficiente de preferencias individuales, pero un pésimo contable de los costes colectivos».</p></blockquote>
<p>Arthur Pigou fue el primero en señalar, hace casi un siglo, que el Estado debe intervenir para que quien contamina pague. Propuso un impuesto correctivo —el <strong>impuesto pigouviano</strong>— que internalice los costes externos. Parece sencillo sobre el papel; en la práctica, los intereses creados y la complejidad técnica han dificultado su aplicación sistemática.</p>
<p>El problema se agrava cuando las externalidades son globales. El cambio climático es la externalidad más grande de la historia de la humanidad: <em>nadie posee la atmósfera, pero todos la usamos como vertedero</em>. Y como los costes los pagamos entre todos —y los beneficios de la contaminación son privados—, el incentivo individual empuja en dirección contraria al bien común.</p>
<img src="https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80" alt="Chimeneas industriales emitiendo humo al atardecer">
<p>No hay solución técnica sin <u>voluntad política</u>. Y la voluntad política escasea cuando los beneficios de la inacción son inmediatos y privados, mientras que los costes de la acción son inmediatos y públicos. Esa asimetría temporal es el verdadero talón de Aquiles de la democracia liberal frente a la crisis ecológica.</p>
<blockquote><p>«El mercado no falla: fallamos nosotros al pedirle que resuelva problemas que solo la política puede abordar».</p></blockquote>
<p>Tal vez el primer paso sea cambiar la pregunta. No preguntarnos cuánto cuesta producir un bien, sino <em>quién paga los costes que el precio no refleja</em>. Porque lo que no se ve sí existe: solo está esperando a que alguien pase la factura.</p>',
  'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1200&q=80',
  ARRAY['ECONOMÍA', 'EXTERNALIDADES', 'MEDIO AMBIENTE', 'PIGOU'],
  'publicado',
  autor_id
);

-- 2
INSERT INTO public.articulos (titulo, subtitulo, slug, contenido, imagen_url, tematicas, estado, autor_id)
VALUES
  'La Mano Invisible Tiene Artritis',
  'Una revisión crítica del dogma del mercado autorregulado desde Adam Smith hasta nuestros días',
  'la-mano-invisible-artritis',
  '<p>La metáfora de la <strong>mano invisible</strong> es, probablemente, la imagen más poderosa que ha producido el pensamiento económico. Adam Smith la mencionó una sola vez en <em>La riqueza de las naciones</em>, y esa única mención bastó para construir sobre ella un edificio ideológico entero.</p>
<blockquote><p>«No es la benevolencia del carnicero, del cervecero o del panadero la que nos procura nuestra cena, sino su propio interés» — Adam Smith</p></blockquote>
<p>Pero hay un problema: <strong>Smith no era el liberal dogmático que sus epígonos han construido</strong>. Antes de <em>La riqueza de las naciones</em>, publicó <em>La teoría de los sentimientos morales</em>, donde sostenía que la simpatía —la capacidad de ponerse en el lugar del otro— era el fundamento de la vida social. El mercado, para Smith, operaba dentro de un marco ético previo que lo contenía y lo limitaba.</p>
<p>Ese marco se ha ido erosionando. El capitalismo contemporáneo ha olvidado las virtudes que Smith daba por supuestas: la prudencia, la justicia, la benevolencia. La mano invisible no solo tiene artritis: está operando sin el esqueleto moral que le daba soporte.</p>
<img src="https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&q=80" alt="Grabado antiguo de Adam Smith">
<p>Las crisis financieras de 2008 y 2020 mostraron con crudeza que el mercado no se autorregula. Cuando los bancos colapsaron, los Estados —es decir, los contribuyentes— tuvieron que intervenir. <em>El capitalismo se socializa en las pérdidas y se privatiza en las ganancias</em>. Esa asimetría es insostenible.</p>
<p>Karl Polanyi, en <em>La gran transformación</em>, argumentó que la idea de un mercado autorregulado era una utopía peligrosa. Los mercados, dijo, están siempre incrustados en relaciones sociales, políticas y culturales. Cuando se pretende liberarlos de esas ataduras, la sociedad reacciona —con movimientos de protección, con conflictos, con crisis.</p>
<blockquote><p>«Permitir que el mecanismo del mercado sea el único director del destino de los seres humanos y de su entorno natural tendría como resultado la demolición de la sociedad» — Karl Polanyi</p></blockquote>
<p>Quizás ha llegado el momento de <u>releer a Smith</u> y recordar que la economía no es una ciencia natural, sino una <em>ciencia moral</em>. Que el mercado es un instrumento, no un fin. Y que una sociedad que pone el intercambio por encima de todo termina canjeando también aquello que no tiene precio: la dignidad, la justicia, el futuro.</p>',
  'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1200&q=80',
  ARRAY['ECONOMÍA', 'ADAM SMITH', 'CAPITALISMO', 'POLANYI'],
  'publicado',
  autor_id
);

-- 3
INSERT INTO public.articulos (titulo, subtitulo, slug, contenido, imagen_url, tematicas, estado, autor_id)
VALUES (
  'Decrecimiento: Un Manifiesto para la Abundancia',
  'Por qué producir menos podría significar vivir mejor',
  'decrecimiento-manifiesto',
  '<p>Decir <strong>decrecimiento</strong> en una facultad de economía es, todavía hoy, una provocación. El dogma del crecimiento infinito está tan arraigado que cuestionarlo parece una herejía. Pero la herejía de ayer es la sensatez de mañana, y los signos de que el modelo actual ha tocado techo son cada vez más difíciles de ignorar.</p>
<p>El PIB crece, nos dicen. Pero el PIB mide la actividad económica, no el bienestar. <em>Contabiliza como positivo tanto la construcción de un hospital como la de una prisión, la cura de un enfermo como la venta de ansiolíticos</em>. Es un indicador grotesco del progreso humano.</p>
<blockquote><p>«Un economista es alguien que sabe el precio de todo y el valor de nada» — atribuido a Oscar Wilde</p></blockquote>
<p>La economía ecológica, representada por figuras como <strong>Herman Daly</strong> o <strong>Serge Latouche</strong>, propone un cambio de paradigma: no preguntarnos cuánto podemos producir, sino <u>cuánto es suficiente</u>. La idea de decrecimiento no es la pobreza generalizada, sino la redistribución y la suficiencia. <em>Se trata de consumir menos para vivir mejor, no de vivir peor con menos.</em></p>
<img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80" alt="Campo de paneles solares al atardecer">
<p>Los datos son contundentes: si toda la humanidad viviera como un ciudadano medio de Estados Unidos, necesitaríamos <strong>cinco planetas</strong>. Pero tenemos uno solo. La eficiencia tecnológica no bastará si no va acompañada de una reducción del consumo en los países del Norte global. La economía circular, las energías renovables y la agricultura regenerativa son condiciones necesarias, pero no suficientes.</p>
<p>El decrecimiento no es nostalgia ni romanticismo. Es un <u>programa de investigación</u> que explora cómo organizar la vida colectiva sin depender de la expansión perpetua del producto material. Incluye propuestas concretas: la reducción de la jornada laboral, la renta básica, el fortalecimiento de los bienes comunes, la relocalización de la producción.</p>
<blockquote><p>«El crecimiento infinito es la ideología del cáncer, no de la vida. Un organismo que crece sin límites no es sano: es un tumor».</p></blockquote>
<p>Frente a la urgencia climática, el decrecimiento deja de ser una opción intelectual entre otras y se convierte en una <strong>necesidad práctica</strong>. La pregunta ya no es si debemos decrecer, sino cómo hacerlo de forma justa y democrática. Porque el decrecimiento puede ser planificado —o puede ser impuesto por el colapso. La diferencia entre uno y otro es lo que llamamos política.</p>',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80',
  ARRAY['ECONOMÍA', 'DECRECIMIENTO', 'ECOLOGÍA', 'CAPITALISMO'],
  'publicado',
  autor_id
);

END $$;
