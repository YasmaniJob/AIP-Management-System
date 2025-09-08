-- Seed initial data for the application

-- Insert default user roles and an initial admin user
-- For demo purposes, we'll just insert one admin user.
-- In a real app, you might have a more complex role system.
INSERT INTO "public"."users" (id, name, email, dni, role, avatar) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin Principal', 'admin@example.com', '12345678', 'Administrador', 'https://avatar.vercel.sh/admin.png')
ON CONFLICT (id) DO NOTHING;


-- Insert common curricular areas
INSERT INTO "public"."areas" (name) VALUES
('Matemática'),
('Comunicación'),
('Ciencia y Tecnología'),
('Personal Social'),
('Arte y Cultura'),
('Educación Religiosa'),
('Educación Física'),
('Inglés como Lengua Extranjera')
ON CONFLICT (name) DO NOTHING;


-- Insert standard primary school grades
INSERT INTO "public"."grades" (name) VALUES
('Primero'),
('Segundo'),
('Tercero'),
('Cuarto'),
('Quinto'),
('Sexto')
ON CONFLICT (name) DO NOTHING;

-- Insert a default set of pedagogical hours
-- This helps in making the reservation system usable from the start.
INSERT INTO "public"."pedagogical_hours" (name, hour_order) VALUES
('1ra Hora', 1),
('2da Hora', 2),
('3ra Hora', 3),
('4ta Hora', 4),
('5ta Hora', 5),
('6ta Hora', 6),
('7ma Hora', 7)
ON CONFLICT (hour_order) DO NOTHING;
