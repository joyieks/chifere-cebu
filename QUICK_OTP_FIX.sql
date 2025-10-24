-- ============================================================================
-- QUICK FIX FOR OTP VERIFICATIONS TABLE
-- Add missing columns without dropping existing data
-- ============================================================================

-- Add missing columns to existing otp_verifications table
ALTER TABLE public.otp_verifications 
ADD COLUMN IF NOT EXISTS purpose text DEFAULT 'verification';

ALTER TABLE public.otp_verifications 
ADD COLUMN IF NOT EXISTS used_at timestamp with time zone;

ALTER TABLE public.otp_verifications 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_purpose 
ON public.otp_verifications(email, purpose);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at 
ON public.otp_verifications(expires_at);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'otp_verifications' 
    AND policyname = 'Allow OTP operations for all users'
  ) THEN
    CREATE POLICY "Allow OTP operations for all users" ON public.otp_verifications
    FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'otp_verifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'OTP verifications table fixed successfully!' as status;


