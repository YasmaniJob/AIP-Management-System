
-- Habilitar la extensión pgcrypto para gen_random_uuid() si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    dni TEXT NOT NULL UNIQUE,
    avatar TEXT,
    role TEXT NOT NULL,
    area TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Categorías de Recursos
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Recursos
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    "number" SERIAL,
    name TEXT,
    brand TEXT,
    model TEXT,
    status TEXT NOT NULL DEFAULT 'Disponible',
    processor_brand TEXT,
    generation TEXT,
    ram TEXT,
    storage TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Préstamos
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id),
    loan_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ NOT NULL,
    actual_return_date TIMESTAMPTZ,
    status TEXT NOT NULL,
    area TEXT,
    grade_id UUID,
    section_id UUID,
    notes TEXT,
    days_overdue INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Asociación Préstamos-Recursos
CREATE TABLE loan_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(loan_id, resource_id)
);


-- Tabla de Áreas Curriculares
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Grados
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Secciones
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, grade_id)
);

-- Tabla de Horas Pedagógicas
CREATE TABLE pedagogical_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hour_order INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Reservas
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    hour_id UUID NOT NULL REFERENCES pedagogical_hours(id),
    teacher_id UUID NOT NULL REFERENCES users(id),
    activity TEXT NOT NULL,
    type TEXT NOT NULL,
    area TEXT,
    grade_id UUID,
    section_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(date, hour_id)
);

-- Tabla para almacenar la información principal de las reuniones
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla para relacionar usuarios y reuniones (participantes)
CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Keep as TEXT to match user IDs
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(meeting_id, user_id)
);

-- Tabla para almacenar las tareas o acuerdos de cada reunión
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendiente',
    assigned_to_id TEXT NOT NULL, -- Keep as TEXT
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);


-- Deshabilitar RLS para todas las tablas para el modo de demostración
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE loan_resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedagogical_hours DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
