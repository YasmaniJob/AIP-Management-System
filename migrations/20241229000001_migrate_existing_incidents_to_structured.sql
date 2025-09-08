-- Migración para convertir incidencias existentes al nuevo formato estructurado
-- Esta migración extrae información del campo description usando expresiones regulares
-- y la almacena en los nuevos campos estructurados

-- Función temporal para extraer contexto de la descripción
CREATE OR REPLACE FUNCTION extract_incident_context(description TEXT)
RETURNS TABLE (
    grade_name TEXT,
    section_name TEXT,
    teacher_name TEXT
) AS $$
BEGIN
    -- Extraer información usando expresiones regulares
    -- Formato esperado: "Contexto del reporte: - Docente: [nombre] - Grado: [grado] - Sección: [sección]"
    
    RETURN QUERY
    SELECT 
        CASE 
            WHEN description ~ 'Grado:\s*([^\s-]+)' THEN
                (regexp_match(description, 'Grado:\s*([^\s-]+)'))[1]
            ELSE NULL
        END as grade_name,
        CASE 
            WHEN description ~ 'Sección:\s*([^\s-]+)' THEN
                (regexp_match(description, 'Sección:\s*([^\s-]+)'))[1]
            ELSE NULL
        END as section_name,
        CASE 
            WHEN description ~ 'Docente:\s*([^-]+?)\s*-' THEN
                trim((regexp_match(description, 'Docente:\s*([^-]+?)\s*-'))[1])
            ELSE NULL
        END as teacher_name;
END;
$$ LANGUAGE plpgsql;

-- Actualizar incidencias existentes con información estructurada
WITH incident_context AS (
    SELECT 
        i.id,
        i.description,
        i.reported_by,
        ctx.grade_name,
        ctx.section_name,
        ctx.teacher_name
    FROM public.incidents i
    CROSS JOIN LATERAL extract_incident_context(i.description) ctx
    WHERE i.description IS NOT NULL
      AND i.description LIKE '%Contexto del reporte%'
),
grade_mapping AS (
    SELECT 
        ic.id as incident_id,
        ic.reported_by,
        ic.teacher_name,
        g.id as grade_id,
        ic.section_name
    FROM incident_context ic
    LEFT JOIN public.grades g ON g.name = ic.grade_name
),
section_mapping AS (
    SELECT 
        gm.incident_id,
        gm.reported_by,
        gm.teacher_name,
        gm.grade_id,
        s.id as section_id
    FROM grade_mapping gm
    LEFT JOIN public.sections s ON s.name = gm.section_name AND s.grade_id = gm.grade_id
),
user_mapping AS (
    SELECT 
        sm.incident_id,
        sm.grade_id,
        sm.section_id,
        u.id as reporter_user_id,
        a.id as area_id
    FROM section_mapping sm
    LEFT JOIN public.users u ON u.name = sm.teacher_name
    LEFT JOIN public.areas a ON a.name = 'Docencia' -- Área por defecto para docentes
)
UPDATE public.incidents 
SET 
    reporter_grade_id = um.grade_id,
    reporter_section_id = um.section_id,
    reporter_area_id = um.area_id,
    booking_context = CASE 
        WHEN um.grade_id IS NOT NULL AND um.section_id IS NOT NULL THEN
            jsonb_build_object(
                'activity', 'Actividad académica',
                'activityDate', created_at::date
            )
        ELSE NULL
    END
FROM user_mapping um
WHERE incidents.id = um.incident_id;

-- Limpiar la función temporal
DROP FUNCTION IF EXISTS extract_incident_context(TEXT);

-- Actualizar la descripción para remover el contexto duplicado
UPDATE public.incidents 
SET description = regexp_replace(
    description, 
    'Contexto del reporte:[^\n]*\n?', 
    '', 
    'g'
)
WHERE description LIKE '%Contexto del reporte%';

-- Limpiar descripciones que quedaron vacías o solo con espacios
UPDATE public.incidents 
SET description = NULLIF(trim(description), '')
WHERE trim(description) = '';

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_grade ON public.incidents(reporter_grade_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_section ON public.incidents(reporter_section_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_area ON public.incidents(reporter_area_id);
CREATE INDEX IF NOT EXISTS idx_incidents_booking_context ON public.incidents USING gin(booking_context);

-- Comentario de finalización
-- Esta migración ha extraído el contexto de las descripciones existentes
-- y lo ha almacenado en los nuevos campos estructurados.
-- Las descripciones han sido limpiadas para remover la información duplicada.