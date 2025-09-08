-- Create the meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a join table for meeting participants
CREATE TABLE IF NOT EXISTS meeting_participants (
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Storing as text as it can reference example users or other non-standard IDs
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    user_avatar TEXT,
    PRIMARY KEY (meeting_id, user_id)
);

-- Create the tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    assigned_to_id TEXT NOT NULL,
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pendiente' or 'Completada'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
