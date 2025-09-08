-- Migración manual para agregar columnas de contexto estructurado
-- Ejecutar este SQL directamente en el dashboard de Supabase o usando psql

-- Agregar columnas de contexto estructurado a la tabla incidents
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS reporter_grade_id UUID,
ADD COLUMN IF NOT EXISTS reporter_section_id UUID,
ADD COLUMN IF NOT EXISTS reporter_area_id UUID,
ADD COLUMN IF NOT EXISTS booking_context JSONB;

-- Agregar relaciones de clave foránea
ALTER TABLE public.incidents 
ADD CONSTRAINT IF NOT EXISTS incidents_reporter_grade_id_fkey 
FOREIGN KEY (reporter_grade_id) REFERENCES public.grades(id);

ALTER TABLE public.incidents 
ADD CONSTRAINT IF NOT EXISTS incidents_reporter_section_id_fkey 
FOREIGN KEY (reporter_section_id) REFERENCES public.sections(id);

ALTER TABLE public.incidents 
ADD CONSTRAINT IF NOT EXISTS incidents_reporter_area_id_fkey 
FOREIGN KEY (reporter_area_id) REFERENCES public.areas(id);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_grade ON public.incidents(reporter_grade_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_section ON public.incidents(reporter_section_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_area ON public.incidents(reporter_area_id);
CREATE INDEX IF NOT EXISTS idx_incidents_booking_context ON public.incidents USING GIN(booking_context);

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN public.incidents.reporter_grade_id IS 'Grado del docente que reporta la incidencia';
COMMENT ON COLUMN public.incidents.reporter_section_id IS 'Sección del docente que reporta la incidencia';
COMMENT ON COLUMN public.incidents.reporter_area_id IS 'Área del docente que reporta la incidencia';
COMMENT ON COLUMN public.incidents.booking_context IS 'Contexto de la reserva relacionada (actividad, hora pedagógica, etc.)';

-- Actualizar la vista active_incidents para incluir los nuevos campos
DROP VIEW IF EXISTS public.active_incidents;
CREATE VIEW public.active_incidents AS
SELECT 
    i.*,
    r.number as resource_number,
    r.brand,
    r.model,
    c.name as category_name,
    u.name as reporter_name,
    u.email as reporter_email,
    g.name as reporter_grade_name,
    s.name as reporter_section_name,
    a.name as reporter_area_name
FROM incidents i
LEFT JOIN resources r ON i.resource_id = r.id
LEFT JOIN categories c ON r.category_id = c.id
LEFT JOIN users u ON i.reported_by = u.id
LEFT JOIN grades g ON i.reporter_grade_id = g.id
LEFT JOIN sections s ON i.reporter_section_id = s.id
LEFT JOIN areas a ON i.reporter_area_id = a.id
WHERE i.status IN ('Reportado', 'En Revisión');

-- Habilitar permisos en la vista
ALTER VIEW public.active_incidents OWNER TO postgres;
GRANT SELECT ON public.active_incidents TO authenticated;
GRANT SELECT ON public.active_incidents TO service_role;