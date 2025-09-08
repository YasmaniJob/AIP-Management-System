-- Crear tabla unificada de mantenimiento
-- Migración para Supabase
-- Fecha: 2025-01-28

-- Crear nueva tabla unificada de mantenimiento
CREATE TABLE IF NOT EXISTS maintenance_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información del recurso (desnormalizada para rendimiento)
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    resource_number VARCHAR(50),
    resource_brand VARCHAR(100),
    resource_model VARCHAR(100),
    resource_category VARCHAR(100),
    resource_type VARCHAR(50),
    
    -- Información del mantenimiento
    maintenance_type VARCHAR(100) NOT NULL,
    damage_description TEXT NOT NULL,
    current_status VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    
    -- Información del docente que reportó (desnormalizada)
    reporter_teacher_name VARCHAR(200),
    reporter_grade VARCHAR(100),
    reporter_section VARCHAR(100),
    report_date DATE NOT NULL,
    
    -- Fechas de seguimiento
    estimated_completion_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Campos adicionales opcionales
    priority VARCHAR(20) DEFAULT 'Media' CHECK (priority IN ('Alta', 'Media', 'Baja')),
    assigned_technician VARCHAR(200),
    repair_notes TEXT,
    
    -- Índices para búsquedas rápidas
    CONSTRAINT valid_status CHECK (current_status IN ('Pendiente', 'En Progreso', 'Completado', 'Cancelado'))
);

-- Comentarios descriptivos
COMMENT ON TABLE maintenance_unified IS 'Tabla unificada de mantenimiento - diseño desnormalizado para máximo rendimiento';
COMMENT ON COLUMN maintenance_unified.resource_number IS 'Número del recurso (desnormalizado para evitar JOINs)';
COMMENT ON COLUMN maintenance_unified.reporter_teacher_name IS 'Nombre del docente que reportó el problema';
COMMENT ON COLUMN maintenance_unified.report_date IS 'Fecha en que se reportó el problema';

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_maintenance_unified_status ON maintenance_unified(current_status);
CREATE INDEX IF NOT EXISTS idx_maintenance_unified_resource ON maintenance_unified(resource_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_unified_category ON maintenance_unified(resource_category);
CREATE INDEX IF NOT EXISTS idx_maintenance_unified_report_date ON maintenance_unified(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_unified_status_category ON maintenance_unified(current_status, resource_category);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_maintenance_unified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    
    -- Auto-completar fecha de finalización cuando el estado cambia a 'Completado'
    IF NEW.current_status = 'Completado' AND OLD.current_status != 'Completado' THEN
        NEW.completed_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualización automática
CREATE TRIGGER trigger_update_maintenance_unified_timestamp
    BEFORE UPDATE ON maintenance_unified
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_unified_timestamp();

-- Vista para recursos que requieren mantenimiento
CREATE OR REPLACE VIEW maintenance_pending AS
SELECT 
    id,
    resource_id,
    resource_number,
    resource_brand,
    resource_model,
    resource_category,
    resource_type,
    maintenance_type,
    damage_description,
    current_status,
    reporter_teacher_name,
    reporter_grade,
    reporter_section,
    report_date,
    estimated_completion_date,
    priority,
    assigned_technician,
    created_at,
    updated_at
FROM maintenance_unified
WHERE current_status != 'Completado'
ORDER BY 
    CASE priority 
        WHEN 'Alta' THEN 1 
        WHEN 'Media' THEN 2 
        WHEN 'Baja' THEN 3 
    END,
    created_at DESC;

-- Vista para mantenimientos completados
CREATE OR REPLACE VIEW maintenance_completed AS
SELECT 
    id,
    resource_id,
    resource_number,
    resource_brand,
    resource_model,
    resource_category,
    resource_type,
    maintenance_type,
    damage_description,
    reporter_teacher_name,
    reporter_grade,
    reporter_section,
    report_date,
    completed_at,
    repair_notes,
    assigned_technician
FROM maintenance_unified
WHERE current_status = 'Completado'
ORDER BY completed_at DESC;

-- Función para obtener estadísticas rápidas
CREATE OR REPLACE FUNCTION get_maintenance_stats()
RETURNS TABLE(
    total_records BIGINT,
    pending_count BIGINT,
    in_progress_count BIGINT,
    completed_count BIGINT,
    high_priority_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE current_status = 'Pendiente') as pending_count,
        COUNT(*) FILTER (WHERE current_status = 'En Progreso') as in_progress_count,
        COUNT(*) FILTER (WHERE current_status = 'Completado') as completed_count,
        COUNT(*) FILTER (WHERE priority = 'Alta' AND current_status != 'Completado') as high_priority_count
    FROM maintenance_unified;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE maintenance_unified ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública
CREATE POLICY "Allow public read access" ON maintenance_unified FOR SELECT USING (true);

-- Política de escritura para usuarios autenticados
CREATE POLICY "Allow authenticated users to manage maintenance" ON maintenance_unified FOR ALL USING (true);