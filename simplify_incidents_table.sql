-- Simplificación de la tabla incidents
-- Mantiene solo los campos esenciales según requerimientos

-- 1. Crear tabla temporal con la nueva estructura
CREATE TABLE incidents_simplified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('Daño', 'Sugerencia')),
    reported_by UUID NOT NULL REFERENCES auth.users(id),
    reporter_grade_id UUID REFERENCES grades(id),
    reporter_section_id UUID REFERENCES sections(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Reportado' CHECK (status IN ('Reportado', 'En Proceso', 'Resuelto', 'Cerrado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migrar datos existentes a la nueva estructura
INSERT INTO incidents_simplified (
    id,
    type,
    reported_by,
    reporter_grade_id,
    reporter_section_id,
    title,
    description,
    status,
    created_at,
    updated_at
)
SELECT 
    id,
    COALESCE(type, 'Daño') as type,
    reported_by,
    reporter_grade_id,
    reporter_section_id,
    title,
    description,
    COALESCE(status, 'Reportado') as status,
    created_at,
    updated_at
FROM incidents
WHERE reported_by IS NOT NULL;

-- 3. Eliminar tabla original y renombrar la nueva
DROP TABLE IF EXISTS incidents CASCADE;
ALTER TABLE incidents_simplified RENAME TO incidents;

-- 4. Recrear índices para optimizar consultas
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_reporter_grade ON incidents(reporter_grade_id);
CREATE INDEX idx_incidents_reporter_section ON incidents(reporter_section_id);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);

-- 5. Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_incidents_updated_at();

-- 6. Habilitar RLS (Row Level Security) si es necesario
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas de seguridad básicas
CREATE POLICY "Users can view all incidents" ON incidents
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own incidents" ON incidents
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can update their own incidents" ON incidents
    FOR UPDATE USING (auth.uid() = reported_by);

-- 8. Comentarios para documentar la estructura
COMMENT ON TABLE incidents IS 'Tabla simplificada de incidencias con campos esenciales';
COMMENT ON COLUMN incidents.type IS 'Tipo de incidencia: Daño o Sugerencia';
COMMENT ON COLUMN incidents.reported_by IS 'Usuario que reportó la incidencia';
COMMENT ON COLUMN incidents.reporter_grade_id IS 'Grado del usuario que reportó';
COMMENT ON COLUMN incidents.reporter_section_id IS 'Sección del usuario que reportó';
COMMENT ON COLUMN incidents.title IS 'Título de la incidencia';
COMMENT ON COLUMN incidents.description IS 'Descripción detallada de la incidencia';
COMMENT ON COLUMN incidents.status IS 'Estado actual de la incidencia';
COMMENT ON COLUMN incidents.created_at IS 'Fecha y hora de creación';
COMMENT ON COLUMN incidents.updated_at IS 'Fecha y hora de última actualización';

-- Verificar la nueva estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'incidents' 
ORDER BY ordinal_position;