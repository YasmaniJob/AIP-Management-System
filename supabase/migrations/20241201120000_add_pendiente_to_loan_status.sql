-- Add 'Pendiente' to the loan_status enum
ALTER TYPE public.loan_status ADD VALUE 'Pendiente' BEFORE 'Activo';