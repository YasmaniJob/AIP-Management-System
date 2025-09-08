-- Script simplificado para crear system_settings
CREATE TABLE public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    allow_registration BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar fila por defecto
INSERT INTO public.system_settings (id, allow_registration) VALUES (1, false);

-- Constraint para una sola fila
ALTER TABLE public.system_settings ADD CONSTRAINT single_row_check CHECK (id = 1);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Allow public read access" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow full access for anon key" ON public.system_settings FOR ALL USING (true);