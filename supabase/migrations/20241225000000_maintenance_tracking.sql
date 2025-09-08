-- Migración para agregar seguimiento de mantenimiento y nuevos estados de recursos
-- Fecha: 2024-12-25

-- Primero, agregar nuevos valores al enum de resource_status
ALTER TYPE public.resource_status ADD VALUE 'En Reparación';
ALTER TYPE public.resource_status ADD VALUE 'Parcialmente Reparado';
ALTER TYPE public.resource_status ADD VALUE 'Esperando Repuestos';
ALTER TYPE public.resource_status ADD VALUE 'Reparado - Pendiente Prueba';

-- Crear tabla de seguimiento de mantenimiento
CREATE TABLE public.maintenance_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    incident_type TEXT NOT NULL, -- Tipo de incidencia (ej: "Pantalla Rota", "Tiene virus")
    incident_description TEXT, -- Descripción detallada del problema
    current_status TEXT NOT NULL DEFAULT 'En Reparación', -- Estado actual del mantenimiento
    priority TEXT NOT NULL DEFAULT 'Media', -- Prioridad: Alta, Media, Baja
    assigned_to TEXT, -- Técnico o responsable asignado
    estimated_completion_date DATE, -- Fecha estimada de finalización
    actual_completion_date DATE, -- Fecha real de finalización
    repair_notes TEXT, -- Notas del proceso de reparación
    parts_needed TEXT[], -- Array de repuestos necesarios
    parts_ordered BOOLEAN DEFAULT false, -- Si se han pedido los repuestos
    cost_estimate DECIMAL(10,2), -- Costo estimado de la reparación
    actual_cost DECIMAL(10,2), -- Costo real de la reparación
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ -- Fecha de finalización del mantenimiento
);

COMMENT ON TABLE public.maintenance_tracking IS 'Seguimiento detallado del proceso de mantenimiento y reparación de recursos.';

-- Crear tabla de historial de estados de mantenimiento
CREATE TABLE public.maintenance_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_id UUID NOT NULL REFERENCES public.maintenance_tracking(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT, -- Usuario que realizó el cambio
    change_reason TEXT, -- Razón del cambio de estado
    notes TEXT, -- Notas adicionales sobre el cambio
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.maintenance_status_history IS 'Historial de cambios de estado en el proceso de mantenimiento.';

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION public.update_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_maintenance_tracking_updated_at
    BEFORE UPDATE ON public.maintenance_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_maintenance_updated_at();

-- Función para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION public.log_maintenance_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el estado cambió
    IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
        INSERT INTO public.maintenance_status_history (
            maintenance_id,
            previous_status,
            new_status,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.current_status,
            NEW.current_status,
            'Estado actualizado automáticamente'
        );
    END IF;
    
    -- Si el estado es "Reparado - Pendiente Prueba" o se marca como completado
    IF NEW.current_status = 'Reparado - Pendiente Prueba' AND OLD.current_status != 'Reparado - Pendiente Prueba' THEN
        NEW.completed_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar cambios de estado
CREATE TRIGGER log_maintenance_status_change_trigger
    BEFORE UPDATE ON public.maintenance_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.log_maintenance_status_change();

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.maintenance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para las nuevas tablas
CREATE POLICY "Allow public read access" ON public.maintenance_tracking FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage maintenance" ON public.maintenance_tracking FOR ALL USING (true);

CREATE POLICY "Allow public read access" ON public.maintenance_status_history FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage history" ON public.maintenance_status_history FOR ALL USING (true);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_maintenance_tracking_resource_id ON public.maintenance_tracking(resource_id);
CREATE INDEX idx_maintenance_tracking_status ON public.maintenance_tracking(current_status);
CREATE INDEX idx_maintenance_tracking_priority ON public.maintenance_tracking(priority);
CREATE INDEX idx_maintenance_status_history_maintenance_id ON public.maintenance_status_history(maintenance_id);