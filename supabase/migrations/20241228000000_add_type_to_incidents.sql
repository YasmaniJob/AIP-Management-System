-- Agregar columna type a la tabla incidents
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Daño' 
CHECK (type IN ('Daño', 'Sugerencia', 'Mantenimiento', 'Hardware', 'Software', 'Otro'));

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_incidents_type ON public.incidents(type);

-- Comentario
COMMENT ON COLUMN public.incidents.type IS 'Tipo de incidencia reportada';