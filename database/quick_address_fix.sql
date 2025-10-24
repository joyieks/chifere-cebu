-- Quick fix for missing address column
-- This adds the essential missing column to buyer_addresses table

-- Add the missing 'address' column
ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'buyer_addresses' 
AND column_name = 'address';

-- Success message
SELECT 'Address column added successfully!' as message;
