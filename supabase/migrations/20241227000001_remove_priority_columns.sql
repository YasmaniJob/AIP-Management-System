-- Migración para eliminar completamente las columnas de prioridad
-- Ya que la gestión no trabaja con valores de prioridad

-- 1. Eliminar restricciones CHECK existentes
ALTER TABLE maintenance_tracking DROP CONSTRAINT IF EXISTS maintenance_tracking_priority_check;
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_priority_check;

-- 2. Eliminar columnas de prioridad
ALTER TABLE maintenance_tracking DROP COLUMN IF EXISTS priority;
ALTER TABLE incidents DROP COLUMN IF EXISTS priority;

-- 3. Comentarios para documentar los cambios
COMMENT ON TABLE maintenance_tracking IS 'Tabla de seguimiento de mantenimiento - sin campos de prioridad para simplicidad';
COMMENT ON TABLE incidents IS 'Tabla de incidentes - sin campos de prioridad para simplicidad';