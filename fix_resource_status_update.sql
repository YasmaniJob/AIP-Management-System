-- Script para corregir la actualización automática del estado del recurso
-- cuando todas las incidencias de mantenimiento están completadas

-- 1. Modificar la función para que también actualice el estado del recurso
CREATE OR REPLACE FUNCTION update_resource_maintenance_summary()
RETURNS TRIGGER AS $$
DECLARE
    resource_uuid UUID;
    total_count INTEGER;
    pending_count INTEGER;
    progress_count INTEGER;
    completed_count INTEGER;
    completion_pct DECIMAL(5,2);
    new_resource_status VARCHAR(50);
BEGIN
    -- Obtener el resource_id del registro afectado
    IF TG_OP = 'DELETE' THEN
        resource_uuid := OLD.resource_id;
    ELSE
        resource_uuid := NEW.resource_id;
    END IF;
    
    -- Calcular estadísticas actuales
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE current_status IN ('Pendiente', 'En Evaluación')),
        COUNT(*) FILTER (WHERE current_status IN ('En Proceso', 'En Reparación', 'Esperando Repuestos')),
        COUNT(*) FILTER (WHERE current_status IN ('Completado', 'Reparado'))
    INTO total_count, pending_count, progress_count, completed_count
    FROM maintenance_incidents_individual 
    WHERE resource_id = resource_uuid;
    
    -- Calcular porcentaje de completitud
    IF total_count > 0 THEN
        completion_pct := (completed_count::DECIMAL / total_count::DECIMAL) * 100;
    ELSE
        completion_pct := 0;
    END IF;
    
    -- Determinar el nuevo estado del recurso
    IF total_count > 0 AND completed_count = total_count THEN
        -- Todas las incidencias están completadas
        new_resource_status := 'Disponible';
    ELSIF total_count > 0 AND (pending_count > 0 OR progress_count > 0) THEN
        -- Hay incidencias pendientes o en proceso
        new_resource_status := 'En Mantenimiento';
    ELSE
        -- No hay incidencias o caso especial
        new_resource_status := NULL; -- No cambiar el estado
    END IF;
    
    -- Actualizar el estado del recurso si es necesario
    IF new_resource_status IS NOT NULL THEN
        UPDATE resources 
        SET status = new_resource_status,
            updated_at = now()
        WHERE id = resource_uuid
          AND status != new_resource_status; -- Solo actualizar si el estado es diferente
        
        -- Log del cambio para debugging
        RAISE NOTICE 'Recurso % actualizado a estado: % (Incidencias: %/% completadas)', 
                     resource_uuid, new_resource_status, completed_count, total_count;
    END IF;
    
    -- Insertar o actualizar el resumen
    INSERT INTO maintenance_resource_summary (
        resource_id,
        total_incidents,
        pending_incidents,
        in_progress_incidents,
        completed_incidents,
        completion_percentage,
        overall_status,
        first_incident_date,
        last_incident_date,
        updated_at
    )
    SELECT 
        resource_uuid,
        total_count,
        pending_count,
        progress_count,
        completed_count,
        completion_pct,
        CASE 
            WHEN completed_count = total_count AND total_count > 0 THEN 'Completado'
            WHEN progress_count > 0 THEN 'En Proceso'
            WHEN pending_count > 0 THEN 'Pendiente'
            ELSE 'Sin Incidencias'
        END,
        (SELECT MIN(created_at) FROM maintenance_incidents_individual WHERE resource_id = resource_uuid),
        (SELECT MAX(created_at) FROM maintenance_incidents_individual WHERE resource_id = resource_uuid),
        now()
    ON CONFLICT (resource_id) DO UPDATE SET
        total_incidents = EXCLUDED.total_incidents,
        pending_incidents = EXCLUDED.pending_incidents,
        in_progress_incidents = EXCLUDED.in_progress_incidents,
        completed_incidents = EXCLUDED.completed_incidents,
        completion_percentage = EXCLUDED.completion_percentage,
        overall_status = EXCLUDED.overall_status,
        first_incident_date = EXCLUDED.first_incident_date,
        last_incident_date = EXCLUDED.last_incident_date,
        updated_at = EXCLUDED.updated_at;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Recrear el trigger (por si no existe)
DROP TRIGGER IF EXISTS update_maintenance_summary_on_incident_change ON maintenance_incidents_individual;
CREATE TRIGGER update_maintenance_summary_on_incident_change
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_incidents_individual
    FOR EACH ROW
    EXECUTE FUNCTION update_resource_maintenance_summary();

-- 3. Función para actualizar manualmente todos los recursos que deberían estar disponibles
CREATE OR REPLACE FUNCTION fix_resource_status_from_incidents()
RETURNS TABLE(resource_id UUID, old_status VARCHAR, new_status VARCHAR, incidents_completed INTEGER, incidents_total INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH incident_summary AS (
        SELECT 
            mii.resource_id,
            COUNT(*) as total_incidents,
            COUNT(*) FILTER (WHERE mii.current_status IN ('Completado', 'Reparado')) as completed_incidents
        FROM maintenance_incidents_individual mii
        GROUP BY mii.resource_id
    ),
    resources_to_update AS (
        SELECT 
            r.id,
            r.status as current_status,
            CASE 
                WHEN is_summary.completed_incidents = is_summary.total_incidents THEN 'Disponible'
                ELSE 'En Mantenimiento'
            END as should_be_status,
            is_summary.completed_incidents,
            is_summary.total_incidents
        FROM resources r
        JOIN incident_summary is_summary ON r.id = is_summary.resource_id
        WHERE r.status != CASE 
                WHEN is_summary.completed_incidents = is_summary.total_incidents THEN 'Disponible'
                ELSE 'En Mantenimiento'
            END
    )
    UPDATE resources 
    SET status = rtu.should_be_status,
        updated_at = now()
    FROM resources_to_update rtu
    WHERE resources.id = rtu.id
    RETURNING rtu.id, rtu.current_status, rtu.should_be_status, rtu.completed_incidents, rtu.total_incidents;
END;
$$ LANGUAGE plpgsql;

-- 4. Ejecutar la corrección manual para recursos existentes
SELECT 'Ejecutando corrección manual de estados de recursos...' as mensaje;
SELECT * FROM fix_resource_status_from_incidents();

SELECT 'Script completado. Los recursos ahora se actualizarán automáticamente cuando todas las incidencias estén completadas.' as resultado;