-- Script para limpiar y simplificar el sistema de mantenimiento
-- Elimina tablas redundantes y mantiene solo las necesarias

-- 1. Respaldar datos importantes antes de eliminar
CREATE TABLE IF NOT EXISTS maintenance_backup AS 
SELECT 
    mt.id,
    mt.resource_id,
    mt.maintenance_type,
    mt.incident_description,
    mt.current_status,
    mt.created_at,
    mt.estimated_completion_date,
    mt.completed_at,
    mt.user_id,
    r.number as resource_number,
    r.brand,
    r.model,
    c.name as category_name,
    c.type as category_type
FROM maintenance_tracking mt
LEFT JOIN resources r ON mt.resource_id = r.id
LEFT JOIN categories c ON r.category_id = c.id;

-- 2. Eliminar tablas redundantes (en orden para evitar errores de FK)
DROP TABLE IF EXISTS maintenance_incident_status_history CASCADE;
DROP TABLE IF EXISTS maintenance_incidents CASCADE;
DROP TABLE IF EXISTS maintenance_incidents_individual CASCADE;
DROP TABLE IF EXISTS maintenance_resource_summary CASCADE;
DROP TABLE IF EXISTS maintenance_status_history CASCADE;
DROP TABLE IF EXISTS maintenance_unified CASCADE;

-- 3. Limpiar triggers y funciones relacionadas
DROP TRIGGER IF EXISTS sync_return_with_maintenance_trigger ON returns;
DROP FUNCTION IF EXISTS sync_return_with_maintenance();
DROP FUNCTION IF EXISTS update_maintenance_summary();
DROP FUNCTION IF EXISTS log_maintenance_status_change();

-- 4. Optimizar la tabla principal de mantenimiento
-- Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_resource_id ON maintenance_tracking(resource_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_status ON maintenance_tracking(current_status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_created_at ON maintenance_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_user_id ON maintenance_tracking(user_id);

-- 5. Crear vista simplificada para consultas comunes
CREATE OR REPLACE VIEW maintenance_view AS
SELECT 
    mt.id,
    mt.resource_id,
    mt.maintenance_type,
    mt.incident_description,
    mt.current_status,
    mt.created_at,
    mt.estimated_completion_date,
    mt.completed_at,
    mt.updated_at,
    r.number as resource_number,
    r.brand as resource_brand,
    r.model as resource_model,
    r.status as resource_status,
    c.name as category_name,
    c.type as category_type,
    u.name as assigned_user_name,
    u.email as assigned_user_email
FROM maintenance_tracking mt
LEFT JOIN resources r ON mt.resource_id = r.id
LEFT JOIN categories c ON r.category_id = c.id
LEFT JOIN users u ON mt.user_id = u.id;

-- 6. Función simplificada para crear registros de mantenimiento desde devoluciones
CREATE OR REPLACE FUNCTION create_maintenance_from_return()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo crear registro si hay daños reportados
    IF NEW.damage_report IS NOT NULL AND NEW.damage_report != '' THEN
        INSERT INTO maintenance_tracking (
            resource_id,
            maintenance_type,
            incident_description,
            current_status,
            created_at,
            updated_at
        )
        SELECT 
            lr.resource_id,
            'Correctivo',
            NEW.damage_report,
            'Pendiente',
            NOW(),
            NOW()
        FROM loan_resources lr
        WHERE lr.loan_id = NEW.loan_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger simplificado
CREATE TRIGGER create_maintenance_from_return_trigger
    AFTER INSERT ON returns
    FOR EACH ROW
    EXECUTE FUNCTION create_maintenance_from_return();

-- 8. Limpiar datos huérfanos en maintenance_tracking
DELETE FROM maintenance_tracking 
WHERE resource_id NOT IN (SELECT id FROM resources);

-- 9. Actualizar estadísticas de la base de datos
ANALYZE maintenance_tracking;
ANALYZE resources;
ANALYZE categories;

-- 10. Mostrar resumen de limpieza
SELECT 
    'Registros de mantenimiento activos' as descripcion,
    COUNT(*) as cantidad
FROM maintenance_tracking
UNION ALL
SELECT 
    'Registros pendientes' as descripcion,
    COUNT(*) as cantidad
FROM maintenance_tracking
WHERE current_status = 'Pendiente'
UNION ALL
SELECT 
    'Registros en progreso' as descripcion,
    COUNT(*) as cantidad
FROM maintenance_tracking
WHERE current_status = 'En Progreso'
UNION ALL
SELECT 
    'Registros completados' as descripcion,
    COUNT(*) as cantidad
FROM maintenance_tracking
WHERE current_status = 'Completado';