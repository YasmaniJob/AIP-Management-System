-- ========= TABLAS =========

-- Eliminar tablas en orden inverso de dependencia para evitar errores
DROP TABLE IF EXISTS public.loan_resources CASCADE;
DROP TABLE IF EXISTS public.meeting_tasks CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.pedagogical_hours CASCADE;
DROP TABLE IF EXISTS public.loans CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.sections CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.areas CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.meeting_participants CASCADE; -- Eliminación explícita


-- ========= ENUMS (TIPOS DE DATOS PERSONALIZADOS) =========

-- Eliminar ENUMs si existen para evitar errores en re-ejecución
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.category_type CASCADE;
DROP TYPE IF EXISTS public.resource_status CASCADE;
DROP TYPE IF EXISTS public.loan_status CASCADE;
DROP TYPE IF EXISTS public.booking_type CASCADE;
DROP TYPE IF EXISTS public.task_status CASCADE;

-- Crear ENUMs
CREATE TYPE public.user_role AS ENUM (
    'Administrador',
    'Docente',
    'Director(a)',
    'Sub-Director(a)',
    'Coordinador(a) Pedagógico',
    'Auxiliar'
);
CREATE TYPE public.category_type AS ENUM (
    'Laptops',
    'Tablets',
    'Proyectores',
    'Cámaras Fotográficas',
    'Filmadoras',
    'Periféricos',
    'Redes',
    'Cables y Adaptadores',
    'Audio',
    'PCs de Escritorio',
    'Mobiliario',
    'Otros'
);
CREATE TYPE public.resource_status AS ENUM (
    'Disponible',
    'En Préstamo',
    'En Mantenimiento',
    'Dañado'
);
CREATE TYPE public.loan_status AS ENUM (
    'Pendiente',
    'Activo',
    'Devuelto',
    'Atrasado'
);
CREATE TYPE public.booking_type AS ENUM (
    'STUDENT',
    'INSTITUTIONAL'
);
CREATE TYPE public.task_status AS ENUM (
    'Pendiente',
    'En Progreso',
    'Completada'
);


-- ========= (RE)CREACIÓN DE TABLAS =========

-- Tabla de Usuarios
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dni TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    avatar TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.users IS 'Tabla para almacenar usuarios (docentes, administradores, etc).';

-- Tabla de Categorías de Recursos
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type category_type NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Categorías para organizar los recursos del inventario.';

-- Tabla de Recursos
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number SERIAL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    brand TEXT,
    model TEXT,
    processor_brand TEXT,
    generation TEXT,
    ram TEXT,
    storage TEXT,
    status resource_status NOT NULL DEFAULT 'Disponible',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.resources IS 'Recursos individuales del inventario.';

-- Tabla de Áreas Curriculares
CREATE TABLE public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.areas IS 'Áreas curriculares para préstamos y reservas.';

-- Tabla de Grados
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.grades IS 'Grados de la institución.';

-- Tabla de Secciones
CREATE TABLE public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, grade_id)
);
COMMENT ON TABLE public.sections IS 'Secciones dentro de cada grado.';

-- Tabla de Préstamos
CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
    grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE RESTRICT,
    status loan_status NOT NULL DEFAULT 'Activo',
    is_authorized BOOLEAN NOT NULL DEFAULT false,
    loan_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    return_date TIMESTAMPTZ, -- Fecha esperada de devolución (mismo día por defecto)
    actual_return_date TIMESTAMPTZ, -- Fecha real de devolución
    days_overdue INT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.loans IS 'Registros de préstamos de recursos.';

-- Tabla de Unión: Préstamos y Recursos
CREATE TABLE public.loan_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.loan_resources IS 'Tabla intermedia para la relación N:M entre préstamos y recursos.';

-- Tabla de Horas Pedagógicas
CREATE TABLE public.pedagogical_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hour_order INT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.pedagogical_hours IS 'Bloques horarios para las reservas del AIP.';

-- Tabla de Reservas
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    hour_id UUID NOT NULL REFERENCES public.pedagogical_hours(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    type booking_type NOT NULL,
    activity TEXT NOT NULL,
    area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
    grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(date, hour_id) -- No puede haber dos reservas en el mismo día y hora
);
COMMENT ON TABLE public.bookings IS 'Reservas del Aula de Innovación Pedagógica.';


-- Tabla de Reuniones
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    participant_groups TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.meetings IS 'Registro de reuniones y acuerdos.';

-- Tabla de Tareas de Reuniones
CREATE TABLE public.meeting_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    responsible_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    status task_status NOT NULL DEFAULT 'Pendiente',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.meeting_tasks IS 'Acuerdos o tareas específicas de una reunión.';

-- Tabla de Configuración del Sistema
CREATE TABLE public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    allow_registration BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.system_settings IS 'Configuración global del sistema.';

-- Insertar configuración por defecto
INSERT INTO public.system_settings (id, allow_registration) VALUES (1, false);

-- Agregar constraint para asegurar que solo exista una fila
ALTER TABLE public.system_settings ADD CONSTRAINT single_row_check CHECK (id = 1);


-- ========= FUNCIONES & TRIGGERS =========

-- Trigger para actualizar el estado de los préstamos a "Atrasado"
-- Esta función se puede ejecutar diariamente con un cron job de Supabase.
CREATE OR REPLACE FUNCTION public.update_overdue_loans()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.loans
  SET status = 'Atrasado',
      days_overdue = EXTRACT(DAY FROM (now() - return_date))
  WHERE
    status = 'Activo' AND
    return_date < now() AND
    actual_return_date IS NULL;
END;
$$;
COMMENT ON FUNCTION public.update_overdue_loans() IS 'Actualiza el estado de los préstamos a "Atrasado" si la fecha de devolución ha pasado.';


-- ========= POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY) =========

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedagogical_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público (lectura)
-- En una aplicación real, esto se restringiría a usuarios autenticados.
-- Para la demo, se permite el acceso público de lectura.
DROP POLICY IF EXISTS "Allow public read access" ON public.users;
CREATE POLICY "Allow public read access" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.categories;
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.resources;
CREATE POLICY "Allow public read access" ON public.resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.areas;
CREATE POLICY "Allow public read access" ON public.areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.grades;
CREATE POLICY "Allow public read access" ON public.grades FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.sections;
CREATE POLICY "Allow public read access" ON public.sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.loans;
CREATE POLICY "Allow public read access" ON public.loans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.loan_resources;
CREATE POLICY "Allow public read access" ON public.loan_resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.pedagogical_hours;
CREATE POLICY "Allow public read access" ON public.pedagogical_hours FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.bookings;
CREATE POLICY "Allow public read access" ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.meetings;
CREATE POLICY "Allow public read access" ON public.meetings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.meeting_tasks;
CREATE POLICY "Allow public read access" ON public.meeting_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.system_settings;
CREATE POLICY "Allow public read access" ON public.system_settings FOR SELECT USING (true);


-- Políticas para escritura (INSERT, UPDATE, DELETE)
-- En una aplicación real, esto se restringiría a roles específicos (ej: 'Administrador').
-- Para la demo, se permite la escritura a cualquier usuario anónimo con la clave de servicio.
DROP POLICY IF EXISTS "Allow full access for anon key" ON public.users;
CREATE POLICY "Allow full access for anon key" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.categories;
CREATE POLICY "Allow full access for anon key" ON public.categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.resources;
CREATE POLICY "Allow full access for anon key" ON public.resources FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.areas;
CREATE POLICY "Allow full access for anon key" ON public.areas FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.grades;
CREATE POLICY "Allow full access for anon key" ON public.grades FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.sections;
CREATE POLICY "Allow full access for anon key" ON public.sections FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.loans;
CREATE POLICY "Allow full access for anon key" ON public.loans FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.loan_resources;
CREATE POLICY "Allow full access for anon key" ON public.loan_resources FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.pedagogical_hours;
CREATE POLICY "Allow full access for anon key" ON public.pedagogical_hours FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.bookings;
CREATE POLICY "Allow full access for anon key" ON public.bookings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.meetings;
CREATE POLICY "Allow full access for anon key" ON public.meetings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.meeting_tasks;
CREATE POLICY "Allow full access for anon key" ON public.meeting_tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow full access for anon key" ON public.system_settings;
CREATE POLICY "Allow full access for anon key" ON public.system_settings FOR ALL USING (true);
