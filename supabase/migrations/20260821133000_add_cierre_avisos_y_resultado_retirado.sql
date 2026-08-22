-- Permite cerrar avisos comunitarios igual que emergencias, vías y servicios.
ALTER TABLE public.avisos
  ADD COLUMN IF NOT EXISTS cerrado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resultado TEXT,
  ADD COLUMN IF NOT EXISTS razon_cierre TEXT;

-- Sustituye cualquier restricción previa sobre resultado para admitir
-- el nuevo cierre administrativo "retirado" en los cuatro módulos.
DO $$
DECLARE
  tabla TEXT;
  restriccion TEXT;
BEGIN
  FOREACH tabla IN ARRAY ARRAY['emergencias', 'vias', 'servicios', 'avisos']
  LOOP
    FOR restriccion IN
      SELECT constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.check_constraints AS cc
        ON tc.constraint_name = cc.constraint_name
        AND tc.constraint_schema = cc.constraint_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = tabla
        AND tc.constraint_type = 'CHECK'
        AND cc.check_clause ILIKE '%resultado%'
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', tabla, restriccion);
    END LOOP;

    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (resultado IS NULL OR resultado IN (''solucionado'', ''no_solucionado'', ''retirado''))',
      tabla,
      tabla || '_resultado_check'
    );
  END LOOP;
END
$$;

COMMENT ON COLUMN public.avisos.cerrado_en IS
  'Momento en que el aviso se cerró o retiró de la cartelera.';
COMMENT ON COLUMN public.avisos.resultado IS
  'Resultado administrativo del cierre: solucionado, no_solucionado o retirado.';
COMMENT ON COLUMN public.avisos.razon_cierre IS
  'Razón obligatoria cuando un aviso se cierra como no solucionado o retirado.';
