-- Migración para reorganizar la tabla maintenance_tracking
-- Estructura simplificada con campos esenciales y nuevos campos propuestos
-- Fecha: 2025-01-28

BEGIN;

-- Eliminar campos innecesarios
ALTER TABLE maintenance_tracking 
  DROP COLUMN IF EXISTS assigned_to,
  DROP COLUMN IF EXISTS actual_completion_date,
  DROP COLUMN IF EXISTS repair_notes,
  DROP COLUMN IF EXISTS parts_needed,
  DROP COLUMN IF EXISTS parts_ordered,
  DROP COLUMN IF EXISTS cost_estimate,
  DROP COLUMN IF EXISTS actual_cost,
  DROP COLUMN IF EXISTS priority;

-- Renombrar incident_type a maintenance_type para mayor claridad
ALTER TABLE maintenance_tracking 
  RENAME COLUMN incident_type TO maintenance_type;

-- Agregar nuevos campos propuestos
ALTER TABLE maintenance_tracking 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS incident_category VARCHAR(20) CHECK (incident_category IN ('daño', 'sugerencia'));

-- Agregar comentarios descriptivos a todos los campos
COMMENT ON COLUMN maintenance_tracking.id IS 'Identificador único del registro de mantenimiento';
COMMENT ON COLUMN maintenance_tracking.resource_id IS 'ID del recurso que requiere mantenimiento';
COMMENT ON COLUMN maintenance_tracking.user_id IS 'Usuario responsable del mantenimiento';
COMMENT ON COLUMN maintenance_tracking.maintenance_type IS 'Tipo de mantenimiento (ej: Preventivo, Correctivo)';
COMMENT ON COLUMN maintenance_tracking.incident_category IS 'Categoría de la incidencia: daño o sugerencia';
COMMENT ON COLUMN maintenance_tracking.incident_description IS 'Descripción detallada del problema y contexto del préstamo';
COMMENT ON COLUMN maintenance_tracking.current_status IS 'Estado actual del mantenimiento';
COMMENT ON COLUMN maintenance_tracking.estimated_completion_date IS 'Fecha estimada de finalización';
COMMENT ON COLUMN maintenance_tracking.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN maintenance_tracking.updated_at IS 'Fecha de última actualización';
COMMENT ON COLUMN maintenance_tracking.completed_at IS 'Fecha de finalización del mantenimiento';

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_user_id ON maintenance_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_incident_category ON maintenance_tracking(incident_category);
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_maintenance_type ON maintenance_tracking(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_tracking_current_status ON maintenance_tracking(current_status);

COMMIT;

-- Estructura final de la tabla:
-- maintenance_tracking (
--   id UUID PRIMARY KEY,
--   resource_id UUID REFERENCES resources(id),
--   user_id UUID REFERENCES users(id),
--   maintenance_type VARCHAR,
--   incident_category VARCHAR(20) CHECK (incident_category IN ('daño', 'sugerencia')),
--   incident_description TEXT,
--   current_status VARCHAR,
--   estimated_completion_date DATE,
--   created_at TIMESTAMP WITH TIME ZONE,
--   updated_at TIMESTAMP WITH TIME ZONE,
--   completed_at TIMESTAMP WITH TIME ZONE
-- );