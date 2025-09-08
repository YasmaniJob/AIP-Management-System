-- Crear los tipos ENUM personalizados
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('Administrador', 'Docente');

DROP TYPE IF EXISTS public.category_type CASCADE;
CREATE TYPE public.category_type AS ENUM (
    'Laptops', 'Tablets', 'Proyectores', 'Cámaras Fotográficas', 'Filmadoras', 
    'Periféricos', 'Redes', 'Cables y Adaptadores', 'Audio', 'PCs de Escritorio', 
    'Mobiliario', 'Otros'
);

DROP TYPE IF EXISTS public.resource_status CASCADE;
CREATE TYPE public.resource_status AS ENUM ('Disponible', 'En Préstamo', 'En Mantenimiento', 'Dañado');

DROP TYPE IF EXISTS public.loan_status CASCADE;
CREATE TYPE public.loan_status AS ENUM ('Pendiente', 'Activo', 'Devuelto', 'Atrasado');

DROP TYPE IF EXISTS public.booking_type CASCADE;
CREATE TYPE public.booking_type AS ENUM ('STUDENT', 'INSTITUTIONAL');

DROP TYPE IF EXISTS public.task_status CASCADE;
CREATE TYPE public.task_status AS ENUM ('Pendiente', 'En Progreso', 'Completada');


-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    dni TEXT NOT NULL UNIQUE,
    avatar TEXT NOT NULL,
    role public.user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.users IS 'Tabla para almacenar usuarios (docentes y administradores).';

-- Tabla de Categorías de Recursos
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type public.category_type NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Categorías para organizar los recursos del inventario.';

-- Tabla de Recursos (Inventario)
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    number SERIAL,
    brand TEXT,
    model TEXT,
    processor_brand TEXT,
    generation TEXT,
    ram TEXT,
    storage TEXT,
    status public.resource_status NOT NULL DEFAULT 'Disponible',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.resources IS 'Recursos individuales del inventario.';

-- Tabla de Áreas Curriculares
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.areas IS 'Áreas curriculares para préstamos y reservas.';

-- Tabla de Grados
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.grades IS 'Grados académicos de la institución.';

-- Tabla de Secciones
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(grade_id, name)
);
COMMENT ON TABLE public.sections IS 'Secciones dentro de cada grado.';

-- Tabla de Préstamos
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id),
    area_id UUID NOT NULL REFERENCES public.areas(id),
    grade_id UUID NOT NULL REFERENCES public.grades(id),
    section_id UUID NOT NULL REFERENCES public.sections(id),
    status public.loan_status NOT NULL DEFAULT 'Activo',
    is_authorized BOOLEAN NOT NULL DEFAULT false,
    loan_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    return_date TIMESTAMPTZ,
    actual_return_date TIMESTAMPTZ,
    days_overdue INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.loans IS 'Registro de préstamos de recursos a docentes.';

-- Tabla de Unión: Préstamos y Recursos
CREATE TABLE IF NOT EXISTS public.loan_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE RESTRICT,
    UNIQUE(loan_id, resource_id)
);
COMMENT ON TABLE public.loan_resources IS 'Tabla de unión para préstamos con múltiples recursos.';

-- Tabla de Horas Pedagógicas
CREATE TABLE IF NOT EXISTS public.pedagogical_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hour_order INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.pedagogical_hours IS 'Bloques horarios para las reservas.';

-- Tabla de Reservas
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    hour_id UUID NOT NULL REFERENCES public.pedagogical_hours(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type public.booking_type NOT NULL,
    activity TEXT NOT NULL,
    area_id UUID REFERENCES public.areas(id),
    grade_id UUID REFERENCES public.grades(id),
    section_id UUID REFERENCES public.sections(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(date, hour_id)
);
COMMENT ON TABLE public.bookings IS 'Reservas del aula de innovación.';

-- Tabla de Reuniones
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.meetings IS 'Registro de reuniones y acuerdos.';

-- Tabla de Grupos Participantes en Reuniones
CREATE TABLE IF NOT EXISTS public.meeting_participant_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.meeting_participant_groups IS 'Grupos de participantes en una reunión.';

-- Tabla de Tareas/Acuerdos de Reuniones
CREATE TABLE IF NOT EXISTS public.meeting_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    responsible_id UUID NOT NULL REFERENCES public.users(id),
    status public.task_status NOT NULL DEFAULT 'Pendiente',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.meeting_tasks IS 'Tareas o acuerdos resultantes de una reunión.';
