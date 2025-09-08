-- Crear tabla de notificaciones para el sistema
-- Esta tabla es necesaria para el funcionamiento del sistema de notificaciones

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('incident_created', 'incident_overdue', 'incident_critical', 'incident_resolved')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    read BOOLEAN NOT NULL DEFAULT false,
    persistent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    metadata JSONB
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_incident ON public.notifications(incident_id);
CREATE INDEX IF NOT EXISTS idx_notifications_resource ON public.notifications(resource_id);

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.notifications IS 'Tabla de notificaciones del sistema';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación';
COMMENT ON COLUMN public.notifications.priority IS 'Prioridad de la notificación';
COMMENT ON COLUMN public.notifications.recipient_id IS 'Usuario destinatario de la notificación';
COMMENT ON COLUMN public.notifications.incident_id IS 'Incidencia relacionada (opcional)';
COMMENT ON COLUMN public.notifications.resource_id IS 'Recurso relacionado (opcional)';
COMMENT ON COLUMN public.notifications.read IS 'Indica si la notificación ha sido leída';
COMMENT ON COLUMN public.notifications.persistent IS 'Indica si la notificación es persistente';
COMMENT ON COLUMN public.notifications.expires_at IS 'Fecha de expiración de la notificación';
COMMENT ON COLUMN public.notifications.metadata IS 'Metadatos adicionales en formato JSON';

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Allow users to read their own notifications" ON public.notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Allow users to update their own notifications" ON public.notifications
    FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "Allow system to create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Crear tabla de reglas de notificación (opcional, para configuración avanzada)
CREATE TABLE IF NOT EXISTS public.notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notification_rules IS 'Reglas de configuración para el sistema de notificaciones';

-- Habilitar RLS para notification_rules
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública de reglas
CREATE POLICY "Allow public read access" ON public.notification_rules
    FOR SELECT USING (true);

-- Política para permitir gestión por administradores
CREATE POLICY "Allow admin management" ON public.notification_rules
    FOR ALL USING (true); -- En producción, restringir a administradores

SELECT 'Tabla notifications creada exitosamente' as resultado;