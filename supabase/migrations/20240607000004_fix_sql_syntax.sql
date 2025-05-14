-- Fix the relationship between orders and users tables
DO $$ 
BEGIN
  -- Drop the foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_customer_id_fkey' AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_customer_id_fkey;
  END IF;

  -- Check if orders_user_id_fkey already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_user_id_fkey' AND table_name = 'orders'
  ) THEN
    -- Rename the column if it exists and is still named customer_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'customer_id'
    ) THEN
      ALTER TABLE orders RENAME COLUMN customer_id TO user_id;
    END IF;

    -- Add the foreign key constraint if the column exists and constraint doesn't exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
  END IF;
END $$;