-- Migración para simplificar la tabla maintenance_tracking
-- Eliminar campos innecesarios que no se utilizan en la aplicación
-- Fecha: 2025-01-28

-- 1. Verificar estructura actual antes de los cambios
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'maintenance_tracking' 
ORDER BY ordinal_position;

-- 2. Eliminar campos innecesarios uno por uno
-- Estos campos no se utilizan en la interfaz actual y solo agregan complejidad

-- Campos relacionados con repuestos (no utilizados)
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS parts_needed;
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS parts_ordered;

-- Campos de costos (no utilizados en la gestión actual)
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS cost_estimate;
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS actual_cost;

-- Campos de gestión avanzada (no utilizados)
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS repair_notes;
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS assigned_to;

-- Campos de fechas específicas (solo se usa estimated_completion_date)
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS actual_completion_date;

-- 3. Comentarios para documentar los cambios
COMMENT ON TABLE maintenance_tracking IS 'Tabla de seguimiento de mantenimiento simplificada - solo campos esenciales';
COMMENT ON COLUMN maintenance_tracking.incident_type IS 'Tipo de incidente reportado (ej: Pantalla Táctil, Pantalla Rota)';
COMMENT ON COLUMN maintenance_tracking.incident_description IS 'Descripción detallada del problema incluyendo contexto del préstamo';
COMMENT ON COLUMN maintenance_tracking.current_status IS 'Estado actual del mantenimiento';
COMMENT ON COLUMN maintenance_tracking.estimated_completion_date IS 'Fecha estimada de finalización del mantenimiento';
COMMENT ON COLUMN maintenance_tracking.completed_at IS 'Fecha y hora de finalización del mantenimiento';

-- 4. Verificar estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'maintenance_tracking' 
ORDER BY ordinal_position;

-- 5. Mostrar registros de ejemplo para verificar que los datos esenciales se mantienen
SELECT 
    id,
    resource_id,
    incident_type,
    LEFT(incident_description, 100) as incident_description_preview,
    current_status,
    estimated_completion_date,
    completed_at,
    created_at
FROM maintenance_tracking 
LIMIT 5;

-- 6. Estadísticas finales
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT current_status) as status_types,
    COUNT(DISTINCT incident_type) as incident_types
FROM maintenance_tracking;