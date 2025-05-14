-- Add additional address fields to users table if they don't exist
DO $$ 
BEGIN
  -- Add city column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'city') THEN
    ALTER TABLE users ADD COLUMN city TEXT;
  END IF;
  
  -- Add county column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'county') THEN
    ALTER TABLE users ADD COLUMN county TEXT;
  END IF;
  
  -- Add postcode column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'postcode') THEN
    ALTER TABLE users ADD COLUMN postcode TEXT;
  END IF;
END $$;