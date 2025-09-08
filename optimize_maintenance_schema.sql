-- Optimización del esquema de mantenimiento
-- Ejecutar estas declaraciones una por una

-- 1. Verificar estructura actual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'maintenance_tracking' 
ORDER BY ordinal_position;

-- 2. Eliminar campos redundantes (ejecutar uno por uno)
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS incident_type;
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS incident_description;
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS parts_needed;
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS parts_ordered;

-- 3. Renombrar campo de costo (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_tracking' AND column_name = 'cost') THEN
        ALTER TABLE maintenance_tracking RENAME COLUMN cost TO actual_cost;
    END IF;
END $$;

-- 4. Agregar campo de costo estimado si no existe
ALTER TABLE maintenance_tracking 
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);

-- 5. Simplificar estados de mantenimiento
-- Primero agregar nueva columna con estados simplificados
ALTER TABLE maintenance_tracking 
ADD COLUMN IF NOT EXISTS simple_status VARCHAR(20) DEFAULT 'pending';

-- 6. Migrar estados existentes a estados simplificados
UPDATE maintenance_tracking SET simple_status = 
    CASE 
        WHEN current_status IN ('Programado', 'En Reparación') THEN 'in_progress'
        WHEN current_status IN ('Parcialmente Reparado', 'Esperando Repuestos', 'Reparado - Pendiente Prueba') THEN 'in_progress'
        WHEN current_status = 'Completado' THEN 'completed'
        ELSE 'pending'
    END;

-- 7. Crear vista simplificada para consultas
CREATE OR REPLACE VIEW maintenance_summary AS
SELECT 
    m.id,
    m.resource_id,
    r.number as resource_number,
    r.name as resource_name,
    c.type as category,
    m.description,
    m.priority,
    COALESCE(m.simple_status, 'pending') as status,
    m.user_id,
    u.name as assigned_to_name,
    m.estimated_completion_date,
    m.actual_completion_date,
    m.estimated_cost,
    m.actual_cost,
    m.created_at,
    m.completed_at,
    COUNT(mi.incident_id) as related_incidents
FROM maintenance_tracking m
JOIN resources r ON m.resource_id = r.id
JOIN categories c ON r.category_id = c.id
LEFT JOIN users u ON m.user_id = u.id
LEFT JOIN maintenance_incidents mi ON m.id = mi.maintenance_id
GROUP BY m.id, r.id, c.id, u.id;

-- 8. Crear índices optimizados
CREATE INDEX IF NOT EXISTS idx_maintenance_simple_status_priority 
ON maintenance_tracking(simple_status, priority);

CREATE INDEX IF NOT EXISTS idx_maintenance_resource_status 
ON maintenance_tracking(resource_id, simple_status);

-- 9. Eliminar tabla de historial de estados (opcional - comentado por seguridad)
-- DROP TABLE IF EXISTS maintenance_status_history CASCADE;

-- 10. Verificar cambios
SELECT 
    'maintenance_tracking' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT simple_status) as status_types
FROM maintenance_tracking;

SELECT simple_status, COUNT(*) as count
FROM maintenance_tracking 
GROUP BY simple_status;