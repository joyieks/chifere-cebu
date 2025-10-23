-- ============================================================================
-- FIX OTP VERIFICATIONS TABLE
-- Add missing 'purpose' column to otp_verifications table
-- ============================================================================

-- Add the missing 'purpose' column to otp_verifications table
ALTER TABLE public.otp_verifications 
ADD COLUMN IF NOT EXISTS purpose text DEFAULT 'verification';

-- Add the missing 'used_at' column for tracking when OTP was used
ALTER TABLE public.otp_verifications 
ADD COLUMN IF NOT EXISTS used_at timestamp with time zone;

-- Create an index on email and purpose for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_purpose 
ON public.otp_verifications(email, purpose);

-- Create an index on expires_at for cleanup operations
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at 
ON public.otp_verifications(expires_at);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'otp_verifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'OTP verifications table updated successfully!' as status;

