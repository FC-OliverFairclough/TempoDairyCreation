-- Add user_id column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'user_id') THEN
    ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);
    
    -- Copy data from customer_id to user_id if customer_id exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
      UPDATE orders SET user_id = customer_id WHERE customer_id IS NOT NULL;
    END IF;
  END IF;
END $$;