-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public read access" ON customers;
CREATE POLICY "Public read access"
ON customers FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin full access" ON customers;
CREATE POLICY "Admin full access"
ON customers FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Add sample customers
INSERT INTO customers (name, email, phone, address, status)
VALUES
  ('John Smith', 'john.smith@example.com', '(555) 123-4567', '123 Main St, Anytown, AN 12345', 'active'),
  ('Sarah Johnson', 'sarah.j@example.com', '(555) 987-6543', '456 Oak Ave, Somewhere, SM 67890', 'active'),
  ('Michael Brown', 'michael.b@example.com', '(555) 456-7890', '789 Pine Rd, Elsewhere, EL 54321', 'inactive'),
  ('Emily Davis', 'emily.d@example.com', '(555) 234-5678', '321 Cedar Ln, Nowhere, NW 13579', 'active'),
  ('Robert Wilson', 'robert.w@example.com', '(555) 876-5432', '654 Birch St, Anywhere, AW 97531', 'inactive')
ON CONFLICT DO NOTHING;

-- Enable realtime
alter publication supabase_realtime add table customers;
