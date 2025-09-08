-- Función para manejar nuevos usuarios registrados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, dni, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'dni',
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$;

-- Trigger que se ejecuta cuando se crea un nuevo usuario en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentarios para documentación
COMMENT ON FUNCTION public.handle_new_user() IS 'Función que inserta automáticamente un nuevo usuario en la tabla public.users cuando se registra en auth.users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger que ejecuta handle_new_user() cuando se crea un nuevo usuario en auth.users';