-- Migración para corregir la función update_loan_status
-- Fecha: 2025-08-27T22:36:49.785Z
-- Problema: Error GREATEST types integer and interval cannot be matched

CREATE OR REPLACE FUNCTION update_loan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular days_overdue correctamente usando EXTRACT para convertir intervalo a entero
  IF NEW.actual_return_date IS NOT NULL AND NEW.return_date IS NOT NULL THEN
    NEW.days_overdue := GREATEST(0, EXTRACT(DAY FROM (NEW.actual_return_date - NEW.return_date)));
  ELSE
    NEW.days_overdue := NULL;
  END IF;
  
  -- Actualizar el status basado en las fechas
  IF NEW.actual_return_date IS NOT NULL THEN
    NEW.status := 'Devuelto'::loan_status;
  ELSIF NEW.return_date < CURRENT_DATE THEN
    NEW.status := 'Atrasado'::loan_status;
  ELSE
    NEW.status := 'Activo'::loan_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    

-- Recrear el trigger
DO $$
BEGIN
  -- Eliminar el trigger existente si existe
  DROP TRIGGER IF EXISTS update_loan_status_trigger ON loans;
  
  -- Crear el trigger actualizado
  CREATE TRIGGER update_loan_status_trigger
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_status();
END
$$;

-- Mensaje de confirmación
SELECT 'Función update_loan_status corregida exitosamente. El error GREATEST ha sido resuelto.' AS resultado;