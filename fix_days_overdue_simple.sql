-- Script simple para corregir el problema de days_overdue en Supabase
-- Ejecutar este código directamente en el SQL Editor de Supabase

-- 1. Primero, verificar la estructura actual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loans' AND column_name = 'days_overdue';

-- 2. Actualizar todos los préstamos con days_overdue correcto
UPDATE loans 
SET days_overdue = CASE 
    WHEN status = 'Devuelto' AND actual_return_date IS NOT NULL AND loan_date IS NOT NULL THEN 
        GREATEST(0, actual_return_date::date - loan_date::date)
    WHEN status = 'Atrasado' AND loan_date IS NOT NULL THEN 
        GREATEST(0, CURRENT_DATE - loan_date::date)
    ELSE 0
END;

-- 3. Verificar que se actualizaron correctamente
SELECT id, status, loan_date, actual_return_date, days_overdue
FROM loans 
WHERE days_overdue IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Si hay triggers problemáticos, eliminarlos temporalmente
-- DROP TRIGGER IF EXISTS update_overdue_loans_trigger ON loans;

-- 5. Verificar que no hay más errores
SELECT COUNT(*) as total_loans, 
       COUNT(*) FILTER (WHERE days_overdue IS NOT NULL) as loans_with_days_overdue
FROM loans;