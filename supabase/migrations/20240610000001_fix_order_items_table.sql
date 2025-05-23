-- Add missing columns to order_items table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'subtotal') THEN
    ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(10,2);
  END IF;

  -- Make sure we have the right foreign key constraints
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

-- Enable RLS for order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM orders WHERE id = order_id)
  );

-- Order_items is already in realtime publication, no need to add it again
-- Commented out to prevent error: alter publication supabase_realtime add table order_items;