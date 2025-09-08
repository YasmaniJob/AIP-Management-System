-- Crear tabla de relación entre mantenimientos e incidentes
CREATE TABLE IF NOT EXISTS public.maintenance_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_id UUID NOT NULL REFERENCES public.maintenance_tracking(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(maintenance_id, incident_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_maintenance_id ON public.maintenance_incidents(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_incident_id ON public.maintenance_incidents(incident_id);

-- Habilitar RLS
ALTER TABLE public.maintenance_incidents ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Allow public read access" ON public.maintenance_incidents FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage maintenance incidents" ON public.maintenance_incidents FOR ALL USING (true);

-- Comentarios
COMMENT ON TABLE public.maintenance_incidents IS 'Tabla de relación entre registros de mantenimiento e incidentes que los motivaron';