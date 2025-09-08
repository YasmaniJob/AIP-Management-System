-- Migración de datos al esquema unificado
-- Ejecutar DESPUÉS de crear la tabla maintenance_unified
-- Fecha: 2025-01-28

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
    'Media' as priority -- Valor por defecto
    
FROM maintenance_tracking mt
LEFT JOIN resources r ON mt.resource_id = r.id
LEFT JOIN categories c ON r.category_id = c.id
WHERE mt.resource_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM maintenance_unified mu 
    WHERE mu.resource_id = mt.resource_id 
    AND mu.created_at = mt.created_at
  )
ORDER BY mt.created_at;

-- Mostrar estadísticas de migración
SELECT 
    'MIGRACIÓN COMPLETADA' as status,
    COUNT(*) as records_migrated
FROM maintenance_unified;

-- Verificar distribución por estado
SELECT 
    current_status,
    COUNT(*) as count
FROM maintenance_unified
GROUP BY current_status
ORDER BY count DESC;