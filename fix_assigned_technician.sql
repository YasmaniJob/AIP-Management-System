-- Solución para el error "record 'new' has no field 'assigned_to'"
-- El problema es que el código intenta usar campos que no existen en la tabla
-- Fecha: 2025-01-30

BEGIN;

-- 1. Agregar el campo assigned_technician que el código espera
ALTER TABLE maintenance_tracking 
ADD COLUMN IF NOT EXISTS assigned_technician TEXT;

-- 2. Agregar comentario descriptivo
COMMENT ON COLUMN maintenance_tracking.assigned_technician IS 'Técnico asignado para realizar el mantenimiento';

-- 3. Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_assigned_technician 
ON maintenance_tracking(assigned_technician);

-- 4. Verificar que el campo se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'maintenance_tracking' 
  AND column_name = 'assigned_technician';

-- 5. Mostrar estructura actualizada de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'maintenance_tracking' 
ORDER BY ordinal_position;

COMMIT;

-- Mensaje de confirmación
SELECT 'Campo assigned_technician agregado exitosamente a maintenance_tracking' as resultado;