-- Migración para eliminar completamente los valores 'Crítica' y 'Media' del sistema
-- Actualiza todos los registros existentes y las restricciones de la base de datos

-- 1. Actualizar registros existentes en maintenance_tracking
-- Convertir 'Crítica' a 'urgent' y 'Media' a 'medium'
UPDATE maintenance_tracking 
SET priority = CASE 
    WHEN priority = 'Crítica' THEN 'urgent'
    WHEN priority = 'Media' THEN 'medium'
    WHEN priority = 'Alta' THEN 'high'
    WHEN priority = 'Baja' THEN 'low'
    ELSE priority
END
WHERE priority IN ('Crítica', 'Media', 'Alta', 'Baja');

-- 2. Actualizar registros existentes en incidents
UPDATE incidents 
SET priority = CASE 
    WHEN priority = 'Crítica' THEN 'urgent'
    WHEN priority = 'Media' THEN 'medium'
    WHEN priority = 'Alta' THEN 'high'
    WHEN priority = 'Baja' THEN 'low'
    ELSE priority
END
WHERE priority IN ('Crítica', 'Media', 'Alta', 'Baja');

-- 3. Eliminar restricciones CHECK existentes que contengan valores en español
-- Para maintenance_tracking
ALTER TABLE maintenance_tracking DROP CONSTRAINT IF EXISTS maintenance_tracking_priority_check;
ALTER TABLE maintenance_tracking DROP CONSTRAINT IF EXISTS chk_maintenance_priority;

-- Para incidents
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_priority_check;
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS chk_incidents_priority;

-- 4. Crear nuevas restricciones CHECK con valores en inglés únicamente
-- Para maintenance_tracking
ALTER TABLE maintenance_tracking 
ADD CONSTRAINT maintenance_tracking_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Para incidents
ALTER TABLE incidents 
ADD CONSTRAINT incidents_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- 5. Actualizar valores por defecto
ALTER TABLE maintenance_tracking ALTER COLUMN priority SET DEFAULT 'medium';
ALTER TABLE incidents ALTER COLUMN priority SET DEFAULT 'medium';

-- 6. Agregar comentarios para documentar los cambios
COMMENT ON COLUMN maintenance_tracking.priority IS 'Prioridad del mantenimiento: low, medium, high, urgent (solo valores en inglés)';
COMMENT ON COLUMN incidents.priority IS 'Prioridad del incidente: low, medium, high, urgent (solo valores en inglés)';