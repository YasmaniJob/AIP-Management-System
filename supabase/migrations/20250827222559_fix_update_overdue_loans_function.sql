-- Fix update_overdue_loans function to not affect returned loans
-- Date: 2025-08-27T22:25:59.029Z


      CREATE OR REPLACE FUNCTION public.update_overdue_loans()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        UPDATE public.loans
        SET status = 'Atrasado',
            days_overdue = EXTRACT(DAY FROM (now() - return_date))
        WHERE
          status = 'Activo' AND
          return_date < now() AND
          actual_return_date IS NULL;
      END;
      $$;
    

COMMENT ON FUNCTION public.update_overdue_loans() IS 'Actualiza el estado de los préstamos a "Atrasado" si la fecha de devolución ha pasado y no han sido devueltos aún.';