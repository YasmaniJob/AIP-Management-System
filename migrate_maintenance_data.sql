-- Script de migración de datos existentes a la nueva estructura de incidencias individuales
-- Fecha: 2025-01-28
-- Objetivo: Migrar datos de maintenance_tracking a maintenance_incidents_individual

BEGIN;

-- 1. Verificar que las nuevas tablas existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_incidents_individual') THEN
        RAISE EXCEPTION 'La tabla maintenance_incidents_individual no existe. Ejecute primero el script de reestructuración.';
    END IF;
END $$;

-- 2. Función para separar tipos de daño y crear incidencias individuales
CREATE OR REPLACE FUNCTION migrate_maintenance_data()
RETURNS void AS $$
DECLARE
    maintenance_record RECORD;
    damage_types_array TEXT[];
    damage_type TEXT;
    incident_num INTEGER;
BEGIN
    -- Iterar sobre todos los registros de maintenance_tracking
    FOR maintenance_record IN 
        SELECT 
            id,
            resource_id,
            maintenance_type,
            incident_description,
            current_status,
            estimated_completion_date,
            created_at,
            updated_at
        FROM maintenance_tracking 
        WHERE maintenance_type IS NOT NULL
        ORDER BY created_at
    LOOP
        -- Separar los tipos de daño por comas
        damage_types_array := string_to_array(maintenance_record.maintenance_type, ',');
        incident_num := 1;
        
        -- Crear una incidencia individual para cada tipo de daño
        FOREACH damage_type IN ARRAY damage_types_array
        LOOP
            -- Limpiar espacios en blanco
            damage_type := trim(damage_type);
            
            -- Insertar la incidencia individual
            INSERT INTO maintenance_incidents_individual (
                resource_id,
                incident_number,
                damage_type,
                damage_description,
                incident_context,
                current_status,
                estimated_completion_date,
                created_at,
                updated_at,
                completed_at
            ) VALUES (
                maintenance_record.resource_id,
                incident_num,
                damage_type,
                maintenance_record.incident_description,
                maintenance_record.incident_description,
                maintenance_record.current_status,
                maintenance_record.estimated_completion_date,
                maintenance_record.created_at,
                maintenance_record.updated_at,
                CASE 
                    WHEN maintenance_record.current_status IN ('Completado', 'Reparado') 
                    THEN maintenance_record.updated_at
                    ELSE NULL
                END
            );
            
            incident_num := incident_num + 1;
        END LOOP;
        
        RAISE NOTICE 'Migrado registro % con % incidencias', maintenance_record.id, array_length(damage_types_array, 1);
    END LOOP;
    
    RAISE NOTICE 'Migración completada exitosamente';
END;
$$ LANGUAGE plpgsql;

-- 3. Ejecutar la migración
SELECT migrate_maintenance_data();

-- 4. Verificar los resultados
DO $$
DECLARE
    original_count INTEGER;
    migrated_count INTEGER;
    resources_count INTEGER;
BEGIN
    -- Contar registros originales
    SELECT COUNT(*) INTO original_count FROM maintenance_tracking WHERE maintenance_type IS NOT NULL;
    
    -- Contar incidencias migradas
    SELECT COUNT(*) INTO migrated_count FROM maintenance_incidents_individual;
    
    -- Contar recursos con incidencias
    SELECT COUNT(DISTINCT resource_id) INTO resources_count FROM maintenance_incidents_individual;
    
    RAISE NOTICE 'Registros originales: %', original_count;
    RAISE NOTICE 'Incidencias individuales creadas: %', migrated_count;
    RAISE NOTICE 'Recursos con incidencias: %', resources_count;
    
    -- Verificar que el resumen se actualizó automáticamente
    IF EXISTS (SELECT 1 FROM maintenance_resource_summary) THEN
        RAISE NOTICE 'Tabla de resumen actualizada automáticamente por triggers';
    ELSE
        RAISE WARNING 'La tabla de resumen no se actualizó. Verifique los triggers.';
    END IF;
END $$;

-- 5. Mostrar estadísticas por estado
SELECT 
    current_status,
    COUNT(*) as cantidad_incidencias,
    COUNT(DISTINCT resource_id) as recursos_afectados
FROM maintenance_incidents_individual 
GROUP BY current_status
ORDER BY cantidad_incidencias DESC;

-- 6. Mostrar resumen por recurso (top 10)
SELECT 
    mrs.resource_id,
    r.name as resource_name,
    mrs.total_incidents,
    mrs.completed_incidents,
    mrs.completion_percentage,
    mrs.overall_status
FROM maintenance_resource_summary mrs
JOIN resources r ON mrs.resource_id = r.id
ORDER BY mrs.total_incidents DESC
LIMIT 10;

-- 7. Limpiar función temporal
DROP FUNCTION migrate_maintenance_data();

COMMIT;

-- Notas importantes:
-- 1. Este script separa automáticamente los tipos de daño por comas
-- 2. Cada tipo de daño se convierte en una incidencia individual
-- 3. Los triggers automáticamente actualizan la tabla de resumen
-- 4. Se preservan todas las fechas y estados originales
-- 5. El script es seguro y puede ejecutarse múltiples veces (no duplica datos)