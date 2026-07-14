-- Actualizar biografías de los escritores
-- Ejecutar en el editor SQL de Supabase

UPDATE public.perfiles SET
  bio = 'Cursa Economía en la Universidade de Santiago de Compostela. En sus textos aborda las contradicciones del capitalismo tardío, la relación entre mercados y poder, y las promesas incumplidas del progreso económico. Le interesa particularmente la economía ecológica y las formas de organización económica alternativas al modelo dominante. Cree que la economía no puede entenderse sin la historia, ni la historia sin la economía.',
  avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
WHERE id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1';

UPDATE public.perfiles SET
  bio = 'Estudia Física en la Universidade de Santiago de Compostela. Escribe sobre los límites del conocimiento científico, la flecha del tiempo y aquello que la física aún no puede explicar: la conciencia, el libre albedrío, el origen de las leyes naturales. Le apasiona la divulgación científica como puente entre la academia y la calle, y encuentra en la filosofía de la ciencia un terreno fértil para la reflexión.',
  avatar_url = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&q=80'
WHERE id = 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2';

UPDATE public.perfiles SET
  bio = 'Estudia Derecho en la Universidad Rey Juan Carlos de Madrid. Sus ensayos giran en torno a la tensión entre la ley escrita y la justicia material, los derechos humanos como conquista siempre reversible, y el papel del Estado frente a la desigualdad. Es lector de filosofía política clásica y contemporánea, y defiende que el derecho debe ser un instrumento al servicio de los más débiles, no una herramienta de consolidación del poder.',
  avatar_url = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&q=80'
WHERE id = 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3';

UPDATE public.perfiles SET
  bio = 'Estudia Humanidades en la Universidad de Navarra. Sus ensayos transitan entre la crítica literaria, la memoria histórica y la pregunta por el sentido en un mundo secularizado. Escribe sobre la experiencia del exilio, el silencio como forma de resistencia y la literatura centroamericana contemporánea. Le interesa la obra de César Vallejo, la poesía de la guerra civil española y la narrativa del desarraigo.',
  avatar_url = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&q=80'
WHERE id = 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4';
