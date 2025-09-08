-- 1. Eliminar tablas existentes en orden inverso para evitar problemas de dependencias
-- Se usa IF EXISTS para evitar errores si las tablas no existen.
DROP TABLE IF EXISTS public.meeting_tasks;
DROP TABLE IF EXISTS public.meeting_participants;
DROP TABLE IF EXISTS public.meetings;

-- 2. Eliminar el tipo ENUM si existe para asegurar una creación limpia
DROP TYPE IF EXISTS public.task_status;

-- 3. Crear el tipo ENUM para el estado de las tareas
CREATE TYPE public.task_status AS ENUM (
    'Pendiente',
    'En Progreso',
    'Completada'
);

-- 4. Crear tabla principal de reuniones (meetings)
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.meetings IS 'Almacena la información de cada reunión.';

-- 5. Crear tabla de participantes de la reunión (meeting_participants)
-- Esta tabla relaciona usuarios con reuniones.
CREATE TABLE public.meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(meeting_id, user_id) -- Un usuario no puede ser participante dos veces en la misma reunión.
);
COMMENT ON TABLE public.meeting_participants IS 'Tabla pivote para los participantes de una reunión.';


-- 6. Crear tabla de tareas/acuerdos de la reunión (meeting_tasks)
CREATE TABLE public.meeting_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    assigned_to_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Si se borra el usuario, la tarea queda sin asignar.
    due_date DATE,
    status public.task_status NOT NULL DEFAULT 'Pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.meeting_tasks IS 'Almacena las tareas o acuerdos generados en una reunión.';

-- Habilitar Row Level Security (RLS) para las nuevas tablas.
-- Es una buena práctica de seguridad en Supabase.
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_tasks ENABLE ROW LEVEL SECURITY;

-- A continuación, podrías añadir las políticas de seguridad (Policies) desde el
-- dashboard de Supabase para definir quién puede leer o escribir en estas tablas.
-- Por ejemplo, permitir que solo los usuarios autenticados puedan ver reuniones.

-- CREATE POLICY "Allow authenticated read access"
-- ON public.meetings FOR SELECT
-- TO authenticated
-- USING (true);
