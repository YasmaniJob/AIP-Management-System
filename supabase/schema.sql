-- supabase/schema.sql

-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    dni TEXT UNIQUE,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'Profesor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Categorías de Recursos
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Recursos
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'Disponible',
    notes TEXT,
    last_loan_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Áreas Curriculares
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Grados
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Secciones (vinculada a Grados)
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(grade_id, name)
);


-- Tabla de Préstamos
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id),
    loan_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ NOT NULL,
    actual_return_date TIMESTAMPTZ,
    status TEXT NOT NULL,
    is_authorized BOOLEAN NOT NULL DEFAULT false,
    area TEXT,
    grade TEXT,
    section TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla intermedia para Préstamos y Recursos (Muchos a Muchos)
CREATE TABLE loan_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id),
    UNIQUE(loan_id, resource_id)
);

-- Tabla de Reservas de Aula
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    purpose TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Habilitar RLS (Row Level Security) para todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Políticas de Acceso (ejemplos básicos, ajustar según necesidad)

-- Permitir lectura pública para la mayoría de las tablas
CREATE POLICY "Allow public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON resources FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON areas FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON grades FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sections FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON loans FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON loan_resources FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON bookings FOR SELECT USING (true);

-- Permitir a los usuarios autenticados insertar, actualizar y eliminar sus propios datos o datos relacionados
-- (Estas son políticas más permisivas, se pueden restringir más)
CREATE POLICY "Allow authenticated users to manage data" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage data" ON resources FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage data" ON areas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage data" ON grades FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage data" ON sections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage data" ON loans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage data" ON loan_resources FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage data" ON bookings FOR ALL USING (auth.role() = 'authenticated');
