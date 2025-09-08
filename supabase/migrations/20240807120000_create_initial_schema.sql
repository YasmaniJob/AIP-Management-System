-- ========= Limpieza y Creación de Enumeraciones (Enums) =========
-- Se eliminan los tipos primero para asegurar un estado limpio, y luego se recrean.

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.resource_status CASCADE;
DROP TYPE IF EXISTS public.category_type CASCADE;
DROP TYPE IF EXISTS public.loan_status CASCADE;
DROP TYPE IF EXISTS public.task_status CASCADE;
DROP TYPE IF EXISTS public.booking_type CASCADE;

create type public.user_role as enum ('Administrador', 'Docente');
create type public.resource_status as enum ('Disponible', 'En Préstamo', 'En Mantenimiento', 'Dañado');
create type public.category_type as enum ('Laptops', 'Tablets', 'Proyectores', 'Cámaras Fotográficas', 'Filmadoras', 'Periféricos', 'Redes', 'Cables y Adaptadores', 'Audio', 'Otros');
create type public.loan_status as enum ('Pendiente', 'Activo', 'Devuelto', 'Atrasado');
create type public.task_status as enum ('Pendiente', 'Completada');
create type public.booking_type as enum ('STUDENT', 'INSTITUTIONAL');


-- ========= Creación de Tablas del Módulo 1 =========

-- Tabla de Usuarios (Docentes y Administradores)
create table public.users (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    name text not null,
    email text unique,
    dni text not null unique,
    avatar text not null,
    role public.user_role not null
);
alter table public.users disable row level security;


-- Tabla de Áreas Curriculares
create table public.areas (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    name text not null unique
);
alter table public.areas disable row level security;


-- Tabla de Grados
create table public.grades (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    name text not null unique
);
alter table public.grades disable row level security;


-- Tabla de Secciones (vinculada a Grados)
create table public.sections (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    name text not null,
    grade_id uuid not null references public.grades(id) on delete cascade,
    unique(name, grade_id)
);
alter table public.sections disable row level security;


-- Tabla de Horas Pedagógicas
create table public.pedagogical_hours (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    name text not null,
    hour_order integer not null unique
);
alter table public.pedagogical_hours disable row level security;
