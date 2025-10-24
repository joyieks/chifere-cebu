-- Complete fix for buyer_addresses table
-- This script addresses all the issues with the address table

-- 1. First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns that the application expects
ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS address_line_1 TEXT;

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS address_line_2 TEXT;

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS barangay TEXT;

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'home';

-- 3. Remove NOT NULL constraints from address_line_1 (if it exists)
ALTER TABLE buyer_addresses 
ALTER COLUMN address_line_1 DROP NOT NULL;

-- 4. Copy data from address to address_line_1 if address exists but address_line_1 is null
UPDATE buyer_addresses 
SET address_line_1 = address 
WHERE address IS NOT NULL AND (address_line_1 IS NULL OR address_line_1 = '');

-- 5. Enable RLS for security
ALTER TABLE buyer_addresses ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for buyer_addresses
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own addresses" ON buyer_addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON buyer_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON buyer_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON buyer_addresses;

-- Create new RLS policies
CREATE POLICY "Users can view their own addresses" ON buyer_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" ON buyer_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" ON buyer_addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" ON buyer_addresses
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'buyer_addresses';

-- Success message
SELECT 'Address table completely fixed!' as message;
