-- IMPORTANTE: Este script debe ejecutarse con privilegios de administrador en Supabase
-- Usar el service role key, no el anon key

-- Aplicar trigger para insertar usuarios automáticamente
-- Función para manejar nuevos usuarios registrados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, dni, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'dni', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Docente')
  );
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta cuando se crea un nuevo usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentarios para documentación
COMMENT ON FUNCTION public.handle_new_user() IS 'Función que inserta automáticamente un nuevo usuario en la tabla public.users cuando se registra en auth.users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger que ejecuta handle_new_user() cuando se crea un nuevo usuario en auth.users';

-- Verificar que el trigger se creó correctamente
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';