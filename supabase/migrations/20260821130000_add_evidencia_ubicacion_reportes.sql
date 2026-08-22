-- Metadatos de evidencia obtenidos de forma puntual durante la creación del reporte.
-- Estas columnas no cambian las políticas actuales de acceso a reportes.
ALTER TABLE public.reportes
  ADD COLUMN latitud DOUBLE PRECISION,
  ADD COLUMN longitud DOUBLE PRECISION,
  ADD COLUMN precision_metros REAL,
  ADD COLUMN capturado_en TIMESTAMPTZ;

ALTER TABLE public.reportes
  ADD CONSTRAINT reportes_latitud_rango
    CHECK (latitud IS NULL OR latitud BETWEEN -90 AND 90),
  ADD CONSTRAINT reportes_longitud_rango
    CHECK (longitud IS NULL OR longitud BETWEEN -180 AND 180),
  ADD CONSTRAINT reportes_precision_metros_no_negativa
    CHECK (precision_metros IS NULL OR precision_metros >= 0);

COMMENT ON COLUMN public.reportes.latitud IS
  'Latitud de la ubicación puntual compartida por la persona durante el reporte.';
COMMENT ON COLUMN public.reportes.longitud IS
  'Longitud de la ubicación puntual compartida por la persona durante el reporte.';
COMMENT ON COLUMN public.reportes.precision_metros IS
  'Precisión aproximada entregada por el dispositivo, en metros.';
COMMENT ON COLUMN public.reportes.capturado_en IS
  'Momento de captura de la fotografía en el dispositivo; no reemplaza created_at como hora de recepción.';
