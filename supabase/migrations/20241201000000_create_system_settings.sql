-- Create system_settings table
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    allow_registration BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings row
INSERT INTO system_settings (id, allow_registration) VALUES (1, false);

-- Disable RLS for system_settings table
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Add constraint to ensure only one row exists
ALTER TABLE system_settings ADD CONSTRAINT single_row_check CHECK (id = 1);