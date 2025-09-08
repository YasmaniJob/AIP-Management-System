-- Reversión de los estados de reparación
-- Restaura las columnas eliminadas en la simplificación de maintenance_tracking

-- Agregar columnas de repuestos
ALTER TABLE maintenance_tracking ADD COLUMN parts_needed TEXT;
ALTER TABLE maintenance_tracking ADD COLUMN parts_ordered BOOLEAN DEFAULT FALSE;

-- Agregar columnas de costos
ALTER TABLE maintenance_tracking ADD COLUMN cost_estimate DECIMAL(10,2);
ALTER TABLE maintenance_tracking ADD COLUMN actual_cost DECIMAL(10,2);

-- Agregar columnas de gestión
ALTER TABLE maintenance_tracking ADD COLUMN repair_notes TEXT;
ALTER TABLE maintenance_tracking ADD COLUMN assigned_to UUID;

-- Agregar fecha de finalización real
ALTER TABLE maintenance_tracking ADD COLUMN actual_completion_date TIMESTAMPTZ;

-- Comentarios sobre la reversión
COMMENT ON COLUMN maintenance_tracking.parts_needed IS 'Descripción de repuestos necesarios para la reparación';
COMMENT ON COLUMN maintenance_tracking.parts_ordered IS 'Indica si los repuestos han sido ordenados';
COMMENT ON COLUMN maintenance_tracking.cost_estimate IS 'Estimación del costo de reparación';
COMMENT ON COLUMN maintenance_tracking.actual_cost IS 'Costo real de la reparación';
COMMENT ON COLUMN maintenance_tracking.repair_notes IS 'Notas adicionales sobre la reparación';
COMMENT ON COLUMN maintenance_tracking.assigned_to IS 'Usuario asignado para realizar la reparación';
COMMENT ON COLUMN maintenance_tracking.actual_completion_date IS 'Fecha real de finalización de la reparación';

-- Verificar la estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'maintenance_tracking' 
ORDER BY ordinal_position;