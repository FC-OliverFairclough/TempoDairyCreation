-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  total_cost DECIMAL(10, 2) NOT NULL,
  delivery_date DATE NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'processing', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table for products in each order
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- Create delivery_preferences table
CREATE TABLE IF NOT EXISTS delivery_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  preferred_days TEXT[] DEFAULT ARRAY['monday', 'wednesday', 'friday'],
  saved_address TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS "Users can view their own data";
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users";
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for products table
DROP POLICY IF EXISTS "Products are viewable by everyone";
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify products";
CREATE POLICY "Only admins can modify products"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for orders table
DROP POLICY IF EXISTS "Users can view their own orders";
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own orders";
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders";
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can modify all orders";
CREATE POLICY "Admins can modify all orders"
  ON orders FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for order_items table
DROP POLICY IF EXISTS "Users can view their own order items";
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can view all order items";
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for delivery_preferences table
DROP POLICY IF EXISTS "Users can view their own delivery preferences";
CREATE POLICY "Users can view their own delivery preferences"
  ON delivery_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can modify their own delivery preferences";
CREATE POLICY "Users can modify their own delivery preferences"
  ON delivery_preferences FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all delivery preferences";
CREATE POLICY "Admins can view all delivery preferences"
  ON delivery_preferences FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Enable realtime for all tables
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table delivery_preferences;
