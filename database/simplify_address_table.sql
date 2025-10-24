-- Simplify address table to use manual address field
-- This script updates the buyer_addresses table to use a simple address field

-- Add simple address column if it doesn't exist
ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Copy data from address_line_1 to address if address_line_1 exists
UPDATE buyer_addresses 
SET address = address_line_1 
WHERE address_line_1 IS NOT NULL AND address IS NULL;

-- Make address column NOT NULL (optional - you can keep it nullable if you prefer)
-- ALTER TABLE buyer_addresses ALTER COLUMN address SET NOT NULL;

-- Drop the complex address_line_1 column (optional - comment out if you want to keep it)
-- ALTER TABLE buyer_addresses DROP COLUMN IF EXISTS address_line_1;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'Address table simplified successfully!' as message;
