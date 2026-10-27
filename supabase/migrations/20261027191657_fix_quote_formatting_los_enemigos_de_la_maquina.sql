-- Fix quote formatting in publication 'los-enemigos-de-la-maquina-6m0u1y'
-- Unifies the Spanish quote paragraph structure with the Galician version by eliminating hard line-break splits.
UPDATE public.publications
SET content = jsonb_set(
  content,
  '{es}',
  to_jsonb(
    replace(
      content->>'es',
      '<blockquote><p>Constituye uno de los errores económicos más corrientes la creencia de que las máquinas,</p><p>en definitiva, crean desempleo. Mil veces destruido, ha resurgido siempre de sus propias</p><p>cenizas con mayor fuerza y vigor.</p></blockquote>',
      '<blockquote><p>Constituye uno de los errores económicos más corrientes la creencia de que las máquinas, en definitiva, crean desempleo. Mil veces destruido, ha resurgido siempre de sus propias cenizas con mayor fuerza y vigor.</p></blockquote>'
    )
  )
)
WHERE slug = 'los-enemigos-de-la-maquina-6m0u1y';
