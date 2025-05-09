-- Create delivery preferences table
CREATE TABLE IF NOT EXISTS delivery_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monday BOOLEAN NOT NULL DEFAULT false,
  wednesday BOOLEAN NOT NULL DEFAULT true,
  friday BOOLEAN NOT NULL DEFAULT true,
  time_slot TEXT NOT NULL DEFAULT 'morning',
  special_instructions TEXT,
  contact_before_delivery BOOLEAN NOT NULL DEFAULT false,
  leave_at_door BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add realtime support
alter publication supabase_realtime add table delivery_preferences;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS delivery_preferences_user_id_idx ON delivery_preferences(user_id);
