-- Ensure order_items table has all required columns
DO $$
BEGIN
    -- Add subtotal column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(10,2);
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    -- Update existing rows to calculate subtotal if needed
    UPDATE order_items 
    SET subtotal = price * quantity 
    WHERE subtotal IS NULL;
END $$;

-- Ensure order_items is in the realtime publication
-- This is commented out because it's already in the publication
-- ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
