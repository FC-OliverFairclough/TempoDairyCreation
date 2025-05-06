-- Fix products table structure
ALTER TABLE IF EXISTS products
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
