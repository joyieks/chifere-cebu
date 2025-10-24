-- Check if address tables exist
-- This script will help diagnose address table issues

-- Check if buyer_addresses table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buyer_addresses') 
    THEN '✅ buyer_addresses table exists'
    ELSE '❌ buyer_addresses table does NOT exist'
  END as buyer_addresses_status;

-- Check if seller_addresses table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_addresses') 
    THEN '✅ seller_addresses table exists'
    ELSE '❌ seller_addresses table does NOT exist'
  END as seller_addresses_status;

-- Show all tables that contain 'address' in the name
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%address%' 
AND table_schema = 'public';

-- If buyer_addresses doesn't exist, create it
CREATE TABLE IF NOT EXISTS buyer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT NOT NULL,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE buyer_addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own addresses" ON buyer_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" ON buyer_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" ON buyer_addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" ON buyer_addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT 'Address table setup completed!' as message;
