-- Add columns to buyer_users table for account disable functionality
-- This script adds the necessary columns to track disabled buyer accounts

-- Add is_active column (defaults to true for existing users)
ALTER TABLE buyer_users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add disabled_at timestamp
ALTER TABLE buyer_users 
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP WITH TIME ZONE;

-- Add disabled_by column (admin who disabled the account)
ALTER TABLE buyer_users 
ADD COLUMN IF NOT EXISTS disabled_by UUID REFERENCES auth.users(id);

-- Add disabled_reason column
ALTER TABLE buyer_users 
ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

-- Update existing users to be active by default
UPDATE buyer_users 
SET is_active = true 
WHERE is_active IS NULL;

-- Create index for better performance on is_active queries
CREATE INDEX IF NOT EXISTS idx_buyer_users_is_active ON buyer_users(is_active);

-- Create index for disabled_at queries
CREATE INDEX IF NOT EXISTS idx_buyer_users_disabled_at ON buyer_users(disabled_at);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_users' 
  AND column_name IN ('is_active', 'disabled_at', 'disabled_by', 'disabled_reason')
ORDER BY column_name;


