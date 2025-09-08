-- Migración para revertir la simplificación de maintenance_tracking
-- Restaurar campos eliminados en la migración 20250128000000_simplify_maintenance_tracking
-- Fecha: 2025-01-29

-- 1. Restaurar campos de repuestos
ALTER TABLE maintenance_tracking ADD COLUMN IF NOT EXISTS parts_needed TEXT;
ALTER TABLE maintenance_tracking ADD COLUMN IF NOT EXISTS parts_ordered BOOLEAN DEFAULT FALSE;

-- 2. Restaurar campos de costos
ALTER TABLE maintenance_tracking ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(10,2);
ALTER TABLE maintenance_tracking ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,2);

-- 3. Restaurar campos de gestión
ALTER TABLE maintenance_tracking ADD COLUMN IF NOT EXISTS repair_notes TEXT;
ALTER TABLE maintenance_tracking ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);

-- 4. Restaurar fecha de finalización real
ALTER TABLE maintenance_tracking ADD COLUMN IF NOT EXISTS actual_completion_date TIMESTAMPTZ;

-- 5. Actualizar comentarios
COMMENT ON TABLE maintenance_tracking IS 'Tabla de seguimiento de mantenimiento con campos completos restaurados';
COMMENT ON COLUMN maintenance_tracking.parts_needed IS 'Descripción de repuestos necesarios para la reparación';
COMMENT ON COLUMN maintenance_tracking.parts_ordered IS 'Indica si los repuestos han sido ordenados';
COMMENT ON COLUMN maintenance_tracking.cost_estimate IS 'Costo estimado de la reparación';
COMMENT ON COLUMN maintenance_tracking.actual_cost IS 'Costo real de la reparación';
COMMENT ON COLUMN maintenance_tracking.repair_notes IS 'Notas detalladas del proceso de reparación';
COMMENT ON COLUMN maintenance_tracking.assigned_to IS 'Usuario asignado para realizar la reparación';
COMMENT ON COLUMN maintenance_tracking.actual_completion_date IS 'Fecha real de finalización del mantenimiento';

-- 6. Crear índices para los campos restaurados
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_assigned_to ON maintenance_tracking(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_parts_ordered ON maintenance_tracking(parts_ordered);

-- 7. Verificar estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'maintenance_tracking' 
ORDER BY ordinal_position;

-- 8. Mostrar estadísticas
SELECT 
    COUNT(*) as total_records,
    COUNT(parts_needed) as records_with_parts_info,
    COUNT(assigned_to) as records_with_assignment,
    COUNT(actual_completion_date) as completed_records
FROM maintenance_tracking;