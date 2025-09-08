-- Script SQL para prevenir incidencias duplicadas
-- Ejecutar en la consola SQL de Supabase

-- 1. Crear función para prevenir duplicados
CREATE OR REPLACE FUNCTION prevent_duplicate_incidents()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar si ya existe una incidencia activa con el mismo resource_id y damage_type
  IF EXISTS (
    SELECT 1 FROM maintenance_incidents_individual 
    WHERE resource_id = NEW.resource_id 
    AND damage_type = NEW.damage_type
    AND current_status != 'Resuelto'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    -- Si existe, actualizar la incidencia existente en lugar de crear una nueva
    UPDATE maintenance_incidents_individual 
    SET 
      damage_description = COALESCE(NEW.damage_description, damage_description),
      incident_context = COALESCE(NEW.incident_context, incident_context),
      updated_at = NOW()
    WHERE resource_id = NEW.resource_id 
    AND damage_type = NEW.damage_type
    AND current_status != 'Resuelto';
    
    -- Prevenir la inserción duplicada
    RETURN NULL;
  END IF;
  
  -- Si no existe duplicado, permitir la inserción
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear trigger para prevenir duplicados
DROP TRIGGER IF EXISTS prevent_duplicate_incidents_trigger ON maintenance_incidents_individual;

CREATE TRIGGER prevent_duplicate_incidents_trigger
  BEFORE INSERT ON maintenance_incidents_individual
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_incidents();

-- 3. Crear índice único para prevenir duplicados a nivel de base de datos
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_incidents 
ON maintenance_incidents_individual (resource_id, damage_type) 
WHERE current_status != 'Resuelto';

-- 4. Función para limpiar duplicados existentes
CREATE OR REPLACE FUNCTION cleanup_duplicate_incidents()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  duplicate_record RECORD;
BEGIN
  -- Encontrar y eliminar duplicados, manteniendo el más antiguo
  FOR duplicate_record IN
    SELECT resource_id, damage_type, array_agg(id ORDER BY created_at) as incident_ids
    FROM maintenance_incidents_individual
    WHERE current_status != 'Resuelto'
    GROUP BY resource_id, damage_type
    HAVING COUNT(*) > 1
  LOOP
    -- Eliminar todos excepto el primero (más antiguo)
    DELETE FROM maintenance_incidents_individual
    WHERE id = ANY(duplicate_record.incident_ids[2:]);
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Función para obtener estadísticas de incidencias
CREATE OR REPLACE FUNCTION get_incidents_stats()
RETURNS TABLE(
  total_incidents BIGINT,
  active_incidents BIGINT,
  resolved_incidents BIGINT,
  potential_duplicates BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_incidents,
    COUNT(*) FILTER (WHERE current_status != 'Resuelto') as active_incidents,
    COUNT(*) FILTER (WHERE current_status = 'Resuelto') as resolved_incidents,
    (
      SELECT COUNT(*) - COUNT(DISTINCT resource_id || '_' || damage_type)
      FROM maintenance_incidents_individual
      WHERE current_status != 'Resuelto'
    ) as potential_duplicates
  FROM maintenance_incidents_individual;
END;
$$ LANGUAGE plpgsql;

-- 6. Vista para monitorear duplicados
CREATE OR REPLACE VIEW v_duplicate_incidents AS
SELECT 
  resource_id,
  damage_type,
  COUNT(*) as incident_count,
  array_agg(id ORDER BY created_at) as incident_ids,
  array_agg(created_at ORDER BY created_at) as creation_dates
FROM maintenance_incidents_individual
WHERE current_status != 'Resuelto'
GROUP BY resource_id, damage_type
HAVING COUNT(*) > 1;

-- Comentarios de uso:
-- Para limpiar duplicados existentes: SELECT cleanup_duplicate_incidents();
-- Para ver estadísticas: SELECT * FROM get_incidents_stats();
-- Para monitorear duplicados: SELECT * FROM v_duplicate_incidents;