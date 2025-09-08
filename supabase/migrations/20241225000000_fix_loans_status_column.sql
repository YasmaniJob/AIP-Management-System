-- Fix loans table status column to use loan_status enum instead of TEXT
-- This migration will ensure that the status column properly uses the enum and doesn't default to 'Activo'

-- First, update any existing loans with invalid status values
UPDATE public.loans 
SET status = 'Pendiente' 
WHERE status NOT IN ('Pendiente', 'Activo', 'Devuelto', 'Atrasado');

-- Change the column type from TEXT to loan_status enum
ALTER TABLE public.loans 
ALTER COLUMN status TYPE public.loan_status 
USING status::public.loan_status;

-- Ensure there's no default value that could be causing the issue
ALTER TABLE public.loans 
ALTER COLUMN status DROP DEFAULT;

-- Add a comment to document the fix
COMMENT ON COLUMN public.loans.status IS 'Status of the loan using loan_status enum. Fixed to prevent automatic defaulting to Activo.';