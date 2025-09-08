-- Agregar campo assigned_to a maintenance_unified para consistencia
-- Migración para Supabase
-- Fecha: 2025-01-30

-- Agregar campo assigned_to como UUID que referencia users(id)
ALTER TABLE maintenance_unified ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);

-- Agregar comentario descriptivo
COMMENT ON COLUMN maintenance_unified.assigned_to IS 'Usuario asignado para realizar la reparación (referencia a users.id)';

-- Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_maintenance_unified_assigned_to ON maintenance_unified(assigned_to);

-- Migrar datos existentes de assigned_technician a assigned_to si es necesario
-- (Solo si assigned_technician contiene IDs válidos de usuarios)
UPDATE maintenance_unified 
SET assigned_to = (
    SELECT id FROM users 
    WHERE users.name = maintenance_unified.assigned_technician 
    OR users.email = maintenance_unified.assigned_technician
    LIMIT 1
)
WHERE assigned_technician IS NOT NULL 
AND assigned_to IS NULL;

-- Mostrar estadísticas después de la migración
SELECT 
    COUNT(*) as total_records,
    COUNT(assigned_technician) as records_with_technician_name,
    COUNT(assigned_to) as records_with_assigned_user,
    COUNT(CASE WHEN assigned_technician IS NOT NULL AND assigned_to IS NULL THEN 1 END) as unmapped_technicians
FROM maintenance_unified;