-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  available BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public read access" ON products;
CREATE POLICY "Public read access"
ON products FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin full access" ON products;
CREATE POLICY "Admin full access"
ON products FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Add sample products
INSERT INTO products (name, description, price, category, available, stock, image_url)
VALUES
  ('Whole Milk', 'Fresh whole milk from local farms', 3.99, 'milk', true, 50, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80'),
  ('Low-Fat Milk', '2% milk, perfect for everyday use', 3.49, 'milk', true, 45, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'),
  ('Butter', 'Creamy butter made from grass-fed cows', 4.99, 'butter', true, 30, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80'),
  ('Yogurt', 'Probiotic plain yogurt', 2.99, 'yogurt', true, 40, 'https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=400&q=80'),
  ('Cheese', 'Aged cheddar cheese', 5.99, 'cheese', true, 25, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80'),
  ('Cream', 'Heavy whipping cream', 3.29, 'cream', true, 35, 'https://images.unsplash.com/photo-1587657565520-6c0c76b9f5f3?w=400&q=80'),
  ('Organic Milk', 'Organic whole milk from grass-fed cows', 4.99, 'organic', true, 30, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'),
  ('Organic Yogurt', 'Organic probiotic yogurt', 3.99, 'organic', true, 25, 'https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=400&q=80')
ON CONFLICT DO NOTHING;

-- Enable realtime
alter publication supabase_realtime add table products;
