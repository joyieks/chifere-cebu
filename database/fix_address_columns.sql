-- Fix missing columns in buyer_addresses table
-- This script adds the missing columns that the address service expects

-- Add missing columns to buyer_addresses table
ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT FALSE;

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8);

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS address_line_1 TEXT;

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS address_line_2 TEXT;

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS barangay VARCHAR(100);

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Philippines';

ALTER TABLE buyer_addresses 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'home';

-- Update existing records to have default values
UPDATE buyer_addresses 
SET 
  is_confirmed = FALSE,
  is_active = TRUE,
  country = 'Philippines',
  type = 'home'
WHERE is_confirmed IS NULL 
   OR is_active IS NULL 
   OR country IS NULL 
   OR type IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'Address table columns fixed successfully!' as message;
