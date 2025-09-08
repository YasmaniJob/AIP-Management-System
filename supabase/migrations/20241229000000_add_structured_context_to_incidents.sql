-- Agregar campos estructurados para el contexto del usuario a la tabla incidents
-- Esto elimina la necesidad de parsear texto con expresiones regulares

ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS reporter_grade_id UUID REFERENCES public.grades(id),
ADD COLUMN IF NOT EXISTS reporter_section_id UUID REFERENCES public.sections(id),
ADD COLUMN IF NOT EXISTS reporter_area_id UUID REFERENCES public.areas(id),
ADD COLUMN IF NOT EXISTS booking_context JSONB;

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

-- Habilitar RLS en la vista (heredará las políticas de la tabla incidents)
ALTER VIEW public.active_incidents OWNER TO postgres;
GRANT SELECT ON public.active_incidents TO authenticated;
GRANT SELECT ON public.active_incidents TO service_role;