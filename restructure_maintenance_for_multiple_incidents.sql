-- Reestructuración para manejar múltiples incidencias independientes
-- Fecha: 2025-01-28
-- Objetivo: Permitir que cada incidencia tenga su propio seguimiento y estado

BEGIN;

-- 1. Crear nueva tabla para incidencias individuales
CREATE TABLE IF NOT EXISTS public.maintenance_incidents_individual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    incident_number INTEGER NOT NULL, -- Número secuencial de la incidencia para este recurso
    
    -- Información del reporte
    reported_by UUID REFERENCES public.users(id),
    reporter_name VARCHAR(255),
    reporter_grade VARCHAR(100),
    reporter_section VARCHAR(100),
    report_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Detalles de la incidencia
    damage_type VARCHAR(255) NOT NULL, -- Tipo específico de daño (ej: "Pantalla Rota", "No Enciende")
    damage_description TEXT, -- Descripción específica de este daño
    incident_context TEXT, -- Contexto del préstamo cuando ocurrió
    
    -- Estado y seguimiento
    current_status VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    priority VARCHAR(20) DEFAULT 'Media' CHECK (priority IN ('Alta', 'Media', 'Baja')),
    
    -- Fechas de seguimiento
    estimated_completion_date DATE,
    actual_completion_date DATE,
    
    -- Información técnica
    assigned_technician VARCHAR(255),
    repair_notes TEXT,
    parts_needed TEXT[],
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    
    -- Metadatos
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    
    -- Constraint para asegurar numeración única por recurso
    UNIQUE(resource_id, incident_number)
);

-- 2. Crear tabla de agrupación de mantenimiento por recurso
CREATE TABLE IF NOT EXISTS public.maintenance_resource_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE UNIQUE,
    
    -- Estadísticas calculadas
    total_incidents INTEGER NOT NULL DEFAULT 0,
    pending_incidents INTEGER NOT NULL DEFAULT 0,
    in_progress_incidents INTEGER NOT NULL DEFAULT 0,
    completed_incidents INTEGER NOT NULL DEFAULT 0,
    
    -- Porcentajes calculados
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Estado general del recurso
    overall_status VARCHAR(50) NOT NULL DEFAULT 'En Evaluación',
    priority VARCHAR(20) DEFAULT 'Media',
    
    -- Fechas importantes
    first_incident_date TIMESTAMPTZ,
    last_incident_date TIMESTAMPTZ,
    estimated_full_completion DATE,
    
    -- Metadatos
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Crear tabla de historial de estados por incidencia
CREATE TABLE IF NOT EXISTS public.maintenance_incident_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.maintenance_incidents_individual(id) ON DELETE CASCADE,
    
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    
    changed_by UUID REFERENCES public.users(id),
    changed_by_name VARCHAR(255),
    change_reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Función para actualizar automáticamente el resumen del recurso
CREATE OR REPLACE FUNCTION update_resource_maintenance_summary()
RETURNS TRIGGER AS $$
DECLARE
    resource_uuid UUID;
    total_count INTEGER;
    pending_count INTEGER;
    progress_count INTEGER;
    completed_count INTEGER;
    completion_pct DECIMAL(5,2);
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

-- 5. Crear triggers para mantener el resumen actualizado
CREATE TRIGGER update_maintenance_summary_on_incident_change
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_incidents_individual
    FOR EACH ROW
    EXECUTE FUNCTION update_resource_maintenance_summary();

-- 6. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers para updated_at
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON maintenance_incidents_individual
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_updated_at();

CREATE TRIGGER update_summary_updated_at
    BEFORE UPDATE ON maintenance_resource_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_updated_at();

-- 8. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_resource_id ON maintenance_incidents_individual(resource_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_status ON maintenance_incidents_individual(current_status);
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_damage_type ON maintenance_incidents_individual(damage_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_priority ON maintenance_incidents_individual(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_created_at ON maintenance_incidents_individual(created_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_summary_resource_id ON maintenance_resource_summary(resource_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_summary_status ON maintenance_resource_summary(overall_status);
CREATE INDEX IF NOT EXISTS idx_maintenance_summary_completion ON maintenance_resource_summary(completion_percentage);

CREATE INDEX IF NOT EXISTS idx_incident_history_incident_id ON maintenance_incident_status_history(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_history_created_at ON maintenance_incident_status_history(created_at);

-- 9. Habilitar RLS (Row Level Security)
ALTER TABLE maintenance_incidents_individual ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_resource_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_incident_status_history ENABLE ROW LEVEL SECURITY;

-- 10. Crear políticas de acceso
CREATE POLICY "Allow public read access" ON maintenance_incidents_individual FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage incidents" ON maintenance_incidents_individual FOR ALL USING (true);

CREATE POLICY "Allow public read access" ON maintenance_resource_summary FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage summaries" ON maintenance_resource_summary FOR ALL USING (true);

CREATE POLICY "Allow public read access" ON maintenance_incident_status_history FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage history" ON maintenance_incident_status_history FOR ALL USING (true);

-- 11. Comentarios descriptivos
COMMENT ON TABLE maintenance_incidents_individual IS 'Tabla para manejar cada incidencia de mantenimiento de forma independiente';
COMMENT ON TABLE maintenance_resource_summary IS 'Resumen calculado automáticamente del estado de mantenimiento por recurso';
COMMENT ON TABLE maintenance_incident_status_history IS 'Historial de cambios de estado para cada incidencia individual';

COMMENT ON COLUMN maintenance_incidents_individual.incident_number IS 'Número secuencial de la incidencia para este recurso específico';
COMMENT ON COLUMN maintenance_incidents_individual.damage_type IS 'Tipo específico de daño (ej: Pantalla Rota, No Enciende, etc.)';
COMMENT ON COLUMN maintenance_resource_summary.completion_percentage IS 'Porcentaje de incidencias completadas para este recurso';

COMMIT;

-- 12. Script de migración de datos existentes (ejecutar por separado si es necesario)
/*
-- Migrar datos de la tabla actual maintenance_tracking a la nueva estructura
INSERT INTO maintenance_incidents_individual (
    resource_id,
    incident_number,
    damage_type,
    damage_description,
    incident_context,
    current_status,
    estimated_completion_date,
    created_at,
    updated_at
)
SELECT 
    resource_id,
    1 as incident_number, -- Todas las incidencias existentes serán la #1
    COALESCE(maintenance_type, 'Mantenimiento General') as damage_type,
    incident_description as damage_description,
    incident_description as incident_context,
    current_status,
    estimated_completion_date,
    created_at,
    updated_at
FROM maintenance_tracking
WHERE maintenance_type IS NOT NULL;
*/

-- Estructura final:
-- 1. maintenance_incidents_individual: Cada incidencia individual con su propio estado
-- 2. maintenance_resource_summary: Resumen automático por recurso con porcentajes
-- 3. maintenance_incident_status_history: Historial de cambios por incidencia
-- 4. Triggers automáticos para mantener consistencia
-- 5. Índices optimizados para consultas eficientes