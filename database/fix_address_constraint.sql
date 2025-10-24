-- Fix address_line_1 NOT NULL constraint issue
-- This script removes the NOT NULL constraint from address_line_1

-- Remove NOT NULL constraint from address_line_1
ALTER TABLE buyer_addresses 
ALTER COLUMN address_line_1 DROP NOT NULL;

-- Add simple address column if it doesn't exist
ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Copy data from address_line_1 to address if address_line_1 exists
UPDATE buyer_addresses 
SET address = address_line_1 
WHERE address_line_1 IS NOT NULL AND address IS NULL;

-- Make address column NOT NULL (optional)
-- ALTER TABLE buyer_addresses ALTER COLUMN address SET NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_addresses' 
AND table_schema = 'public'
AND column_name IN ('address', 'address_line_1')
ORDER BY ordinal_position;

-- Success message
SELECT 'Address constraint fixed successfully!' as message;
