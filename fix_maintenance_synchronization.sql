-- Script para sincronizar el sistema de mantenimiento con devoluciones y tipos de incidencias
-- Problema identificado: Los datos de mantenimiento no están sincronizados con el contexto de docentes

-- 1. Crear tabla de devoluciones si no existe
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    return_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    condition_on_return TEXT NOT NULL DEFAULT 'Bueno', -- 'Bueno', 'Dañado', 'Perdido'
    damage_description TEXT,
    reported_issues TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.returns IS 'Registro de devoluciones de recursos con su estado';

-- 2. Actualizar incidencias existentes con información del docente desde préstamos
WITH loan_context AS (
    SELECT DISTINCT
        lr.resource_id,
        l.teacher_id,
        u.name as teacher_name,
        g.name as grade_name,
        s.name as section_name,
        l.loan_date,
        ROW_NUMBER() OVER (PARTITION BY lr.resource_id ORDER BY l.loan_date DESC) as rn
    FROM loan_resources lr
    JOIN loans l ON lr.loan_id = l.id
    JOIN users u ON l.teacher_id = u.id
    LEFT JOIN grades g ON l.grade_id = g.id
    LEFT JOIN sections s ON l.section_id = s.id
    WHERE l.status IN ('Devuelto', 'Activo')
)
UPDATE maintenance_incidents_individual 
SET 
    reporter_name = lc.teacher_name,
    reporter_grade = lc.grade_name,
    reporter_section = lc.section_name,
    reported_by = lc.teacher_id::text
FROM loan_context lc
WHERE maintenance_incidents_individual.resource_id = lc.resource_id
    AND lc.rn = 1
    AND (maintenance_incidents_individual.reporter_name IS NULL 
         OR maintenance_incidents_individual.reporter_name = '');

-- 3. Crear función para sincronizar automáticamente las devoluciones con incidencias
CREATE OR REPLACE FUNCTION sync_return_with_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la devolución indica daño, crear incidencia de mantenimiento
    IF NEW.condition_on_return = 'Dañado' AND NEW.damage_description IS NOT NULL THEN
        -- Obtener información del docente y contexto
        INSERT INTO maintenance_incidents_individual (
            resource_id,
            incident_number,
            reported_by,
            reporter_name,
            reporter_grade,
            reporter_section,
            damage_type,
            damage_description,
            incident_context,
            current_status,
            priority
        )
        SELECT 
            NEW.resource_id,
            COALESCE(MAX(mii.incident_number), 0) + 1,
            NEW.teacher_id::text,
            u.name,
            g.name,
            s.name,
            'Daño Reportado en Devolución',
            NEW.damage_description,
            'Reportado durante devolución el ' || NEW.return_date::date,
            'Pendiente',
            'Media'
        FROM users u
        LEFT JOIN loans l ON l.teacher_id = u.id AND l.id = NEW.loan_id
        LEFT JOIN grades g ON l.grade_id = g.id
        LEFT JOIN sections s ON l.section_id = s.id
        LEFT JOIN maintenance_incidents_individual mii ON mii.resource_id = NEW.resource_id
        WHERE u.id = NEW.teacher_id
        GROUP BY u.name, g.name, s.name;
        
        -- Actualizar estado del recurso
        UPDATE resources 
        SET status = 'Dañado'
        WHERE id = NEW.resource_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS trigger_sync_return_maintenance ON public.returns;
CREATE TRIGGER trigger_sync_return_maintenance
    AFTER INSERT ON public.returns
    FOR EACH ROW
    EXECUTE FUNCTION sync_return_with_maintenance();

-- 5. Crear vista para mostrar el estado completo de mantenimiento con contexto
CREATE OR REPLACE VIEW maintenance_with_context AS
SELECT 
    mrs.*,
    r.number as resource_number,
    r.brand,
    r.model,
    r.status as resource_status,
    c.name as category_name,
    c.type as category_type,
    -- Información del último préstamo/devolución
    COALESCE(mii.reporter_name, last_loan.teacher_name) as context_teacher_name,
    COALESCE(mii.reporter_grade, last_loan.grade_name) as context_grade,
    COALESCE(mii.reporter_section, last_loan.section_name) as context_section,
    last_loan.loan_date as last_loan_date,
    ret.return_date as last_return_date,
    ret.condition_on_return
FROM maintenance_resource_summary mrs
JOIN resources r ON mrs.resource_id = r.id
JOIN categories c ON r.category_id = c.id
LEFT JOIN maintenance_incidents_individual mii ON mrs.resource_id = mii.resource_id 
    AND mii.incident_number = 1
LEFT JOIN LATERAL (
    SELECT 
        l.teacher_id,
        u.name as teacher_name,
        g.name as grade_name,
        s.name as section_name,
        l.loan_date
    FROM loan_resources lr
    JOIN loans l ON lr.loan_id = l.id
    JOIN users u ON l.teacher_id = u.id
    LEFT JOIN grades g ON l.grade_id = g.id
    LEFT JOIN sections s ON l.section_id = s.id
    WHERE lr.resource_id = mrs.resource_id
    ORDER BY l.loan_date DESC
    LIMIT 1
) last_loan ON true
LEFT JOIN returns ret ON ret.resource_id = mrs.resource_id 
    AND ret.created_at = (
        SELECT MAX(created_at) 
        FROM returns 
        WHERE resource_id = mrs.resource_id
    );

-- 6. Actualizar la función getResourcesRequiringMaintenance para usar la nueva vista
COMMENT ON VIEW maintenance_with_context IS 'Vista completa de mantenimiento con contexto de docentes y devoluciones';

-- 7. Insertar datos de ejemplo para testing (opcional)
-- Esto se puede ejecutar solo si se necesitan datos de prueba
/*
INSERT INTO returns (loan_id, resource_id, teacher_id, condition_on_return, damage_description)
SELECT 
    l.id,
    lr.resource_id,
    l.teacher_id,
    CASE 
        WHEN r.status = 'Dañado' THEN 'Dañado'
        ELSE 'Bueno'
    END,
    CASE 
        WHEN r.status = 'Dañado' THEN 'Recurso devuelto con daños'
        ELSE NULL
    END
FROM loans l
JOIN loan_resources lr ON l.id = lr.loan_id
JOIN resources r ON lr.resource_id = r.id
WHERE l.status = 'Devuelto'
    AND NOT EXISTS (
        SELECT 1 FROM returns 
        WHERE loan_id = l.id AND resource_id = lr.resource_id
    )
LIMIT 10;
*/

SELECT 'Script de sincronización completado. Ejecutar las funciones de mantenimiento ahora deberían mostrar datos reales.' as resultado;