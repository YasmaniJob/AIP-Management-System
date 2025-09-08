-- Script para agregar la columna incident_category faltante
-- Ejecutar este script en la base de datos de Supabase

BEGIN;

-- Agregar la columna incident_category si no existe
ALTER TABLE maintenance_tracking 
  ADD COLUMN IF NOT EXISTS incident_category VARCHAR(20) CHECK (incident_category IN ('daño', 'sugerencia'));

-- Agregar comentario descriptivo
COMMENT ON COLUMN maintenance_tracking.incident_category IS 'Categoría de la incidencia: daño o sugerencia';

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_incident_category ON maintenance_tracking(incident_category);

COMMIT;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'maintenance_tracking' 
AND column_name = 'incident_category';