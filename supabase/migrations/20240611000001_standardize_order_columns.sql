-- Standardize column names and ensure all necessary columns exist

-- First, check if we need to add any missing columns to the orders table
DO $$ 
BEGIN
  -- Add delivery_status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_status') THEN
    ALTER TABLE orders ADD COLUMN delivery_status TEXT DEFAULT 'processing';
  END IF;

  -- Add payment_status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  -- Add payment_intent_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_intent_id') THEN
    ALTER TABLE orders ADD COLUMN payment_intent_id TEXT;
  END IF;

  -- Add stripe_session_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'stripe_session_id') THEN
    ALTER TABLE orders ADD COLUMN stripe_session_id TEXT;
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Migrate data from order_status to delivery_status if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_status') THEN
    UPDATE orders SET delivery_status = order_status WHERE delivery_status IS NULL AND order_status IS NOT NULL;
  END IF;
END $$;

-- Now check and fix the order_items table
DO $$ 
BEGIN
  -- Add quantity if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'quantity') THEN
    ALTER TABLE order_items ADD COLUMN quantity INTEGER DEFAULT 1;
  END IF;

  -- Add price if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price') THEN
    ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Ensure foreign keys are properly set up
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc 
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'order_items' AND ccu.table_name = 'orders'
  ) THEN
    ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc 
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'order_items' AND ccu.table_name = 'products'
  ) THEN
    ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
DO $$ 
BEGIN
  -- Index for stripe_session_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'idx_orders_stripe_session_id') THEN
    CREATE INDEX idx_orders_stripe_session_id ON orders(stripe_session_id);
  END IF;

  -- Index for payment_intent_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'idx_orders_payment_intent_id') THEN
    CREATE INDEX idx_orders_payment_intent_id ON orders(payment_intent_id);
  END IF;

  -- Index for order_items.order_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'order_items' AND indexname = 'idx_order_items_order_id') THEN
    CREATE INDEX idx_order_items_order_id ON order_items(order_id);
  END IF;
END $$;
