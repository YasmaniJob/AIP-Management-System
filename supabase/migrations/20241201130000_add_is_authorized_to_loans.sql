-- Add is_authorized column to loans table
ALTER TABLE public.loans ADD COLUMN is_authorized BOOLEAN NOT NULL DEFAULT false;

-- Add comment for the new column
COMMENT ON COLUMN public.loans.is_authorized IS 'Indicates if the loan has been authorized by an administrator';