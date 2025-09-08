-- Migración para agregar configuración de personalización de la aplicación
-- Fecha: 2024-12-26

-- Agregar nuevas columnas a la tabla system_settings
ALTER TABLE public.system_settings 
ADD COLUMN app_name TEXT DEFAULT 'AIP Manager',
ADD COLUMN app_logo_url TEXT DEFAULT NULL,
ADD COLUMN primary_color TEXT DEFAULT 'hsl(208, 82%, 56%)',
ADD COLUMN accent_color TEXT DEFAULT 'hsl(159, 65%, 45%)',
ADD COLUMN theme_preset TEXT DEFAULT 'default';

-- Comentarios para las nuevas columnas
COMMENT ON COLUMN public.system_settings.app_name IS 'Nombre personalizado de la aplicación';
COMMENT ON COLUMN public.system_settings.app_logo_url IS 'URL del logo personalizado de la aplicación';
COMMENT ON COLUMN public.system_settings.primary_color IS 'Color primario del tema en formato HSL';
COMMENT ON COLUMN public.system_settings.accent_color IS 'Color de acento del tema en formato HSL';
COMMENT ON COLUMN public.system_settings.theme_preset IS 'Preset de tema predefinido (default, blue, green, purple, etc.)';

-- Actualizar la fila existente con los valores por defecto
UPDATE public.system_settings 
SET 
    app_name = 'AIP Manager',
    app_logo_url = NULL,
    primary_color = 'hsl(208, 82%, 56%)',
    accent_color = 'hsl(159, 65%, 45%)',
    theme_preset = 'default'
WHERE id = 1;

-- Función para actualizar el timestamp updated_at cuando se modifica la configuración
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente updated_at
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_system_settings_updated_at();

COMMENT ON FUNCTION public.update_system_settings_updated_at() IS 'Actualiza automáticamente el campo updated_at cuando se modifica la configuración del sistema';