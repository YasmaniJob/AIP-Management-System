-- Optimización de consultas de mantenimiento
-- Ejecutar después de aplicar optimize_maintenance_schema.sql

-- 1. Crear índices adicionales para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_composite 
ON maintenance_tracking(simple_status, estimated_completion_date);

CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_dates 
ON maintenance_tracking(created_at, estimated_completion_date, actual_completion_date);

CREATE INDEX IF NOT EXISTS idx_resources_category_status 
ON resources(category_id, status);

-- 2. Optimizar la vista maintenance_summary para mejor rendimiento
DROP VIEW IF EXISTS maintenance_summary;

CREATE VIEW maintenance_summary AS
SELECT 
    m.id,
    m.resource_id,
    r.number as resource_number,
    r.name as resource_name,
    c.type as category,
    m.description,
    m.priority,
    COALESCE(m.simple_status, 'pending') as status,
    m.current_status as original_status,
    m.user_id,
    u.name as assigned_to_name,
    m.estimated_completion_date,
    m.actual_completion_date,
    m.estimated_cost,
    m.actual_cost,
    m.created_at,
    m.completed_at,
    -- Calcular si está vencido
    CASE 
        WHEN m.estimated_completion_date < CURRENT_DATE 
             AND COALESCE(m.simple_status, 'pending') != 'completed' 
        THEN true 
        ELSE false 
    END as is_overdue,
    -- Calcular progreso simplificado
    CASE 
        WHEN COALESCE(m.simple_status, 'pending') = 'completed' THEN 100
        WHEN COALESCE(m.simple_status, 'pending') = 'in_progress' THEN 60
        ELSE 10
    END as progress,
    -- Contar incidentes relacionados (optimizado)
    COALESCE(incident_count.count, 0) as related_incidents
FROM maintenance_tracking m
JOIN resources r ON m.resource_id = r.id
JOIN categories c ON r.category_id = c.id
LEFT JOIN users u ON m.user_id = u.id
LEFT JOIN (
    SELECT maintenance_id, COUNT(*) as count
    FROM maintenance_incidents
    GROUP BY maintenance_id
) incident_count ON m.id = incident_count.maintenance_id;

-- 3. Crear vista para recursos que requieren mantenimiento (optimizada)
CREATE OR REPLACE VIEW resources_requiring_maintenance_optimized AS
SELECT DISTINCT
    r.id,
    r.name,
    r.number,
    r.status,
    c.type as category,
    r.last_maintenance_date,
    r.next_maintenance_date,
    -- Calcular prioridad basada en fecha de mantenimiento
    CASE 
        WHEN r.next_maintenance_date < CURRENT_DATE THEN 'urgent'
        WHEN r.next_maintenance_date < CURRENT_DATE + INTERVAL '7 days' THEN 'high'
        WHEN r.next_maintenance_date < CURRENT_DATE + INTERVAL '30 days' THEN 'medium'
        ELSE 'low'
    END as maintenance_priority,
    -- Días desde último mantenimiento
    CASE 
        WHEN r.last_maintenance_date IS NOT NULL 
        THEN CURRENT_DATE - r.last_maintenance_date
        ELSE NULL
    END as days_since_last_maintenance
FROM resources r
JOIN categories c ON r.category_id = c.id
WHERE 
    r.status IN ('Disponible', 'En Uso', 'Mantenimiento Requerido')
    AND (
        r.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days'
        OR r.status = 'Mantenimiento Requerido'
        OR NOT EXISTS (
            SELECT 1 FROM maintenance_tracking mt 
            WHERE mt.resource_id = r.id 
            AND mt.simple_status IN ('pending', 'in_progress')
        )
    )
ORDER BY 
    CASE 
        WHEN r.next_maintenance_date < CURRENT_DATE THEN 1
        WHEN r.status = 'Mantenimiento Requerido' THEN 2
        ELSE 3
    END,
    r.next_maintenance_date ASC;

-- 4. Función optimizada para obtener estadísticas de mantenimiento
CREATE OR REPLACE FUNCTION get_maintenance_stats()
RETURNS TABLE(
    total_count bigint,
    pending_count bigint,
    in_progress_count bigint,
    completed_count bigint,
    overdue_count bigint,
    avg_completion_days numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE simple_status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE simple_status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE simple_status = 'completed') as completed_count,
        COUNT(*) FILTER (
            WHERE estimated_completion_date < CURRENT_DATE 
            AND simple_status != 'completed'
        ) as overdue_count,
        AVG(
            CASE 
                WHEN actual_completion_date IS NOT NULL AND created_at IS NOT NULL
                THEN EXTRACT(DAYS FROM actual_completion_date - created_at)
                ELSE NULL
            END
        ) as avg_completion_days
    FROM maintenance_tracking;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger optimizado para actualizar simple_status automáticamente
CREATE OR REPLACE FUNCTION update_simple_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar simple_status basado en current_status
    NEW.simple_status := 
        CASE 
            WHEN NEW.current_status ILIKE '%completado%' THEN 'completed'
            WHEN NEW.current_status ILIKE ANY(ARRAY['%reparación%', '%programado%', '%parcialmente%', '%esperando%', '%pendiente prueba%']) THEN 'in_progress'
            ELSE 'pending'
        END;
    
    -- Actualizar completed_at si se marca como completado
    IF NEW.simple_status = 'completed' AND OLD.simple_status != 'completed' THEN
        NEW.completed_at := CURRENT_TIMESTAMP;
        NEW.actual_completion_date := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_update_simple_status ON maintenance_tracking;
CREATE TRIGGER trigger_update_simple_status
    BEFORE UPDATE ON maintenance_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_simple_status_trigger();

-- 6. Limpiar datos inconsistentes (opcional)
-- UPDATE maintenance_tracking SET simple_status = 'pending' WHERE simple_status IS NULL;
-- UPDATE maintenance_tracking SET priority = 'medium' WHERE priority IS NULL;

-- 7. Verificar optimizaciones
SELECT 
    'maintenance_summary' as view_name,
    COUNT(*) as record_count
FROM maintenance_summary
UNION ALL
SELECT 
    'resources_requiring_maintenance_optimized' as view_name,
    COUNT(*) as record_count
FROM resources_requiring_maintenance_optimized;

-- 8. Mostrar estadísticas usando la nueva función
SELECT * FROM get_maintenance_stats();

-- 9. Análisis de rendimiento de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('maintenance_tracking', 'resources')
ORDER BY idx_tup_read DESC;