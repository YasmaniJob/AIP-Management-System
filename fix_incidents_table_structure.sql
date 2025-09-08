-- Script para corregir la estructura de la tabla incidents
-- Este script verifica y actualiza la tabla para que coincida con el código

-- 1. Verificar si la tabla incidents existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents') THEN
        RAISE NOTICE 'La tabla incidents no existe, creándola...';
        
        -- Crear la tabla incidents con la estructura correcta
        CREATE TABLE public.incidents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
            reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(50) NOT NULL CHECK (type IN ('Daño', 'Sugerencia', 'Mantenimiento', 'Hardware', 'Software', 'Otro')),
            status VARCHAR(20) NOT NULL DEFAULT 'Reportado' CHECK (status IN ('Reportado', 'En Revisión', 'Resuelto')),
            resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
            resolved_at TIMESTAMPTZ,
            resolution_notes TEXT,
            
            -- Campos de contexto estructurado
            reporter_grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
            reporter_section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
            reporter_area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
            booking_context JSONB,
            
            -- Timestamps
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        RAISE NOTICE 'Tabla incidents creada exitosamente';
    ELSE
        RAISE NOTICE 'La tabla incidents ya existe, verificando columnas...';
        
        -- Verificar y agregar columnas faltantes
        
        -- Verificar resource_id
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'resource_id') THEN
            ALTER TABLE public.incidents ADD COLUMN resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE;
            RAISE NOTICE 'Columna resource_id agregada';
        END IF;
        
        -- Verificar reported_by
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'reported_by') THEN
            ALTER TABLE public.incidents ADD COLUMN reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Columna reported_by agregada';
        END IF;
        
        -- Verificar title
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'title') THEN
            ALTER TABLE public.incidents ADD COLUMN title VARCHAR(255) NOT NULL;
            RAISE NOTICE 'Columna title agregada';
        END IF;
        
        -- Verificar description
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'description') THEN
            ALTER TABLE public.incidents ADD COLUMN description TEXT;
            RAISE NOTICE 'Columna description agregada';
        END IF;
        
        -- Verificar type
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'type') THEN
            ALTER TABLE public.incidents ADD COLUMN type VARCHAR(50) NOT NULL CHECK (type IN ('Daño', 'Sugerencia', 'Mantenimiento', 'Hardware', 'Software', 'Otro'));
            RAISE NOTICE 'Columna type agregada';
        END IF;
        
        -- Verificar status
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'status') THEN
            ALTER TABLE public.incidents ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Reportado' CHECK (status IN ('Reportado', 'En Revisión', 'Resuelto'));
            RAISE NOTICE 'Columna status agregada';
        END IF;
        
        -- Verificar resolved_by
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'resolved_by') THEN
            ALTER TABLE public.incidents ADD COLUMN resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Columna resolved_by agregada';
        END IF;
        
        -- Verificar resolved_at
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'resolved_at') THEN
            ALTER TABLE public.incidents ADD COLUMN resolved_at TIMESTAMPTZ;
            RAISE NOTICE 'Columna resolved_at agregada';
        END IF;
        
        -- Verificar resolution_notes
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'resolution_notes') THEN
            ALTER TABLE public.incidents ADD COLUMN resolution_notes TEXT;
            RAISE NOTICE 'Columna resolution_notes agregada';
        END IF;
        
        -- Verificar reporter_grade_id
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'reporter_grade_id') THEN
            ALTER TABLE public.incidents ADD COLUMN reporter_grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL;
            RAISE NOTICE 'Columna reporter_grade_id agregada';
        END IF;
        
        -- Verificar reporter_section_id
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'reporter_section_id') THEN
            ALTER TABLE public.incidents ADD COLUMN reporter_section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL;
            RAISE NOTICE 'Columna reporter_section_id agregada';
        END IF;
        
        -- Verificar reporter_area_id
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'reporter_area_id') THEN
            ALTER TABLE public.incidents ADD COLUMN reporter_area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;
            RAISE NOTICE 'Columna reporter_area_id agregada';
        END IF;
        
        -- Verificar booking_context
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'booking_context') THEN
            ALTER TABLE public.incidents ADD COLUMN booking_context JSONB;
            RAISE NOTICE 'Columna booking_context agregada';
        END IF;
        
        -- Verificar created_at
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'created_at') THEN
            ALTER TABLE public.incidents ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
            RAISE NOTICE 'Columna created_at agregada';
        END IF;
        
        -- Verificar updated_at
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'updated_at') THEN
            ALTER TABLE public.incidents ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
            RAISE NOTICE 'Columna updated_at agregada';
        END IF;
    END IF;
END
$$;

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_incidents_resource_id ON public.incidents(resource_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON public.incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON public.incidents(type);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_grade ON public.incidents(reporter_grade_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_section ON public.incidents(reporter_section_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_area ON public.incidents(reporter_area_id);
CREATE INDEX IF NOT EXISTS idx_incidents_booking_context ON public.incidents USING GIN(booking_context);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_updated_at ON public.incidents(updated_at);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de acceso
DROP POLICY IF EXISTS "Allow public read access" ON public.incidents;
DROP POLICY IF EXISTS "Allow authenticated users to manage incidents" ON public.incidents;

CREATE POLICY "Allow public read access" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage incidents" ON public.incidents FOR ALL USING (true);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger para actualizar updated_at en cada modificación
DROP TRIGGER IF EXISTS update_incidents_updated_at ON public.incidents;
CREATE TRIGGER update_incidents_updated_at 
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificar que la tabla equipment_history existe para el historial
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment_history') THEN
        CREATE TABLE public.equipment_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
            event_type VARCHAR(50) NOT NULL,
            event_description TEXT NOT NULL,
            performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        CREATE INDEX idx_equipment_history_resource_id ON public.equipment_history(resource_id);
        CREATE INDEX idx_equipment_history_event_type ON public.equipment_history(event_type);
        CREATE INDEX idx_equipment_history_created_at ON public.equipment_history(created_at);
        
        RAISE NOTICE 'Tabla equipment_history creada';
    END IF;
END
$$;

-- 8. Trigger para crear entrada en historial cuando se crea una incidencia
CREATE OR REPLACE FUNCTION create_incident_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.equipment_history (
        resource_id,
        event_type,
        event_description,
        performed_by,
        metadata
    ) VALUES (
        NEW.resource_id,
        'Incidencia',
        'Incidencia reportada: ' || NEW.title,
        NEW.reported_by,
        jsonb_build_object(
            'incident_id', NEW.id,
            'type', NEW.type,
            'status', NEW.status
        )
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS create_incident_history_trigger ON public.incidents;
CREATE TRIGGER create_incident_history_trigger AFTER INSERT ON public.incidents
    FOR EACH ROW EXECUTE FUNCTION create_incident_history();

-- 9. Trigger para crear entrada en historial cuando se resuelve una incidencia
CREATE OR REPLACE FUNCTION update_incident_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo crear entrada si el status cambió a 'Resuelto'
    IF OLD.status != 'Resuelto' AND NEW.status = 'Resuelto' THEN
        INSERT INTO public.equipment_history (
            resource_id,
            event_type,
            event_description,
            performed_by,
            metadata
        ) VALUES (
            NEW.resource_id,
            'Incidencia',
            'Incidencia resuelta: ' || NEW.title,
            NEW.resolved_by,
            jsonb_build_object(
                'incident_id', NEW.id,
                'type', NEW.type,
                'status', NEW.status,
                'resolution_notes', NEW.resolution_notes
            )
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_incident_history_trigger ON public.incidents;
CREATE TRIGGER update_incident_history_trigger AFTER UPDATE ON public.incidents
    FOR EACH ROW EXECUTE FUNCTION update_incident_history();

-- 10. Mensaje final
DO $$
BEGIN
    RAISE NOTICE '✅ Script de corrección de tabla incidents completado exitosamente';
    RAISE NOTICE 'La tabla incidents ahora tiene la estructura correcta y está lista para usar';
END
$$;