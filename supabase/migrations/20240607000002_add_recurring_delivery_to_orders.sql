-- Add recurring_delivery column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'recurring_delivery') THEN
    ALTER TABLE orders ADD COLUMN recurring_delivery BOOLEAN DEFAULT FALSE;
  END IF;
END $$;