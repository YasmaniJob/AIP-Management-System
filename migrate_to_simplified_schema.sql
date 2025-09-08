-- MIGRACIÓN DE DATOS AL ESQUEMA SIMPLIFICADO
-- Transfiere datos de las tablas actuales a maintenance_unified
-- Fecha: 2025-01-28

BEGIN;

-- =====================================================
-- VERIFICACIONES PREVIAS
-- =====================================================

-- Verificar que la nueva tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_unified') THEN
        RAISE EXCEPTION 'La tabla maintenance_unified no existe. Ejecute primero simplified_maintenance_schema.sql';
    END IF;
END $$;

-- Mostrar estadísticas antes de la migración
SELECT 
    'ANTES DE MIGRACIÓN' as momento,
    (SELECT COUNT(*) FROM maintenance_tracking) as maintenance_tracking_count,
    (SELECT COUNT(*) FROM maintenance_incidents_individual) as incidents_individual_count,
    (SELECT COUNT(*) FROM maintenance_unified) as maintenance_unified_count;

-- =====================================================
-- MIGRACIÓN DE DATOS
-- =====================================================

-- Insertar datos desde maintenance_tracking con información de recursos y docentes
INSERT INTO maintenance_unified (
    resource_id,
    resource_number,
    resource_brand,
    resource_model,
    resource_category,
    resource_type,
    maintenance_type,
    damage_description,
    current_status,
    reporter_teacher_name,
    reporter_grade,
    reporter_section,
    report_date,
    estimated_completion_date,
    completed_at,
    created_at,
    updated_at,
    assigned_technician,
    priority
)
SELECT DISTINCT
    mt.resource_id,
    COALESCE(r.number, 'N/A') as resource_number,
    COALESCE(r.brand, 'N/A') as resource_brand,
    COALESCE(r.model, 'N/A') as resource_model,
    COALESCE(c.name, 'Sin Categoría') as resource_category,
    COALESCE(c.type, 'N/A') as resource_type,
    COALESCE(mt.maintenance_type, mt.incident_type, 'Mantenimiento General') as maintenance_type,
    COALESCE(mt.incident_description, 'Sin descripción') as damage_description,
    COALESCE(mt.current_status, 'Pendiente') as current_status,
    
    -- Extraer información del docente desde incident_context de la primera incidencia
    COALESCE(
        (
            SELECT 
                CASE 
                    WHEN mii.incident_context IS NOT NULL AND mii.incident_context != '' THEN
                        COALESCE(
                            (mii.incident_context::jsonb->>'teacherName'),
                            (mii.incident_context::jsonb->>'teacher_name'),
                            'Docente no identificado'
                        )
                    ELSE 'Docente no identificado'
                END
            FROM maintenance_incidents_individual mii 
            WHERE mii.resource_id = mt.resource_id 
            ORDER BY mii.created_at ASC 
            LIMIT 1
        ),
        'Docente no identificado'
    ) as reporter_teacher_name,
    
    COALESCE(
        (
            SELECT 
                CASE 
                    WHEN mii.incident_context IS NOT NULL AND mii.incident_context != '' THEN
                        COALESCE(
                            (mii.incident_context::jsonb->>'gradeName'),
                            (mii.incident_context::jsonb->>'grade_name'),
                            'Grado no especificado'
                        )
                    ELSE 'Grado no especificado'
                END
            FROM maintenance_incidents_individual mii 
            WHERE mii.resource_id = mt.resource_id 
            ORDER BY mii.created_at ASC 
            LIMIT 1
        ),
        'Grado no especificado'
    ) as reporter_grade,
    
    COALESCE(
        (
            SELECT 
                CASE 
                    WHEN mii.incident_context IS NOT NULL AND mii.incident_context != '' THEN
                        COALESCE(
                            (mii.incident_context::jsonb->>'sectionName'),
                            (mii.incident_context::jsonb->>'section_name'),
                            'Sección no especificada'
                        )
                    ELSE 'Sección no especificada'
                END
            FROM maintenance_incidents_individual mii 
            WHERE mii.resource_id = mt.resource_id 
            ORDER BY mii.created_at ASC 
            LIMIT 1
        ),
        'Sección no especificada'
    ) as reporter_section,
    
    -- Fecha de reporte desde la primera incidencia o fecha de creación del tracking
    COALESCE(
        (
            SELECT DATE(mii.created_at)
            FROM maintenance_incidents_individual mii 
            WHERE mii.resource_id = mt.resource_id 
            ORDER BY mii.created_at ASC 
            LIMIT 1
        ),
        DATE(mt.created_at)
    ) as report_date,
    
    mt.estimated_completion_date,
    mt.completed_at,
    mt.created_at,
    COALESCE(mt.updated_at, mt.created_at) as updated_at,
    
    -- Técnico asignado (si existe en el esquema actual)
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_tracking' AND column_name = 'assigned_to') 
        THEN mt.assigned_to
        ELSE NULL
    END as assigned_technician,
    
    -- Prioridad (si existe, sino Media por defecto)
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_tracking' AND column_name = 'priority') 
        THEN COALESCE(mt.priority, 'Media')
        ELSE 'Media'
    END as priority
    
FROM maintenance_tracking mt
LEFT JOIN resources r ON mt.resource_id = r.id
LEFT JOIN categories c ON r.category_id = c.id
WHERE mt.resource_id IS NOT NULL
ORDER BY mt.created_at;

-- =====================================================
-- VERIFICACIONES POST-MIGRACIÓN
-- =====================================================

-- Mostrar estadísticas después de la migración
SELECT 
    'DESPUÉS DE MIGRACIÓN' as momento,
    (SELECT COUNT(*) FROM maintenance_tracking) as maintenance_tracking_count,
    (SELECT COUNT(*) FROM maintenance_incidents_individual) as incidents_individual_count,
    (SELECT COUNT(*) FROM maintenance_unified) as maintenance_unified_count;

-- Verificar que los datos se migraron correctamente
SELECT 
    'VERIFICACIÓN DE DATOS' as tipo,
    COUNT(*) as total_records,
    COUNT(DISTINCT resource_id) as unique_resources,
    COUNT(*) FILTER (WHERE reporter_teacher_name != 'Docente no identificado') as records_with_teacher,
    COUNT(*) FILTER (WHERE current_status = 'Completado') as completed_records,
    COUNT(*) FILTER (WHERE current_status != 'Completado') as pending_records
FROM maintenance_unified;

-- Mostrar algunos ejemplos de datos migrados
SELECT 
    'EJEMPLOS DE DATOS MIGRADOS' as tipo,
    resource_number,
    resource_category,
    maintenance_type,
    LEFT(damage_description, 50) || '...' as damage_preview,
    current_status,
    reporter_teacher_name,
    reporter_grade,
    report_date
FROM maintenance_unified
ORDER BY created_at DESC
LIMIT 5;

-- Verificar distribución por estado
SELECT 
    'DISTRIBUCIÓN POR ESTADO' as tipo,
    current_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM maintenance_unified), 2) as percentage
FROM maintenance_unified
GROUP BY current_status
ORDER BY count DESC;

-- Verificar distribución por categoría
SELECT 
    'DISTRIBUCIÓN POR CATEGORÍA' as tipo,
    resource_category,
    COUNT(*) as count
FROM maintenance_unified
GROUP BY resource_category
ORDER BY count DESC
LIMIT 10;

COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Esta migración preserva todos los datos existentes
-- 2. Los campos JSON se parsean y desnormalizan para mejor rendimiento
-- 3. Se mantiene la trazabilidad con las fechas originales
-- 4. Los datos faltantes se completan con valores por defecto
-- 5. Después de verificar que todo funciona, se pueden deprecar las tablas antiguas

-- =====================================================
-- COMANDOS PARA ROLLBACK (SI ES NECESARIO):
-- =====================================================
-- TRUNCATE TABLE maintenance_unified;
-- -- O para eliminar completamente:
-- -- DROP TABLE maintenance_unified CASCADE;