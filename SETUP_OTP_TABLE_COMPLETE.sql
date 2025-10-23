-- ============================================================================
-- COMPLETE OTP VERIFICATIONS TABLE SETUP
-- This script ensures the otp_verifications table has all required columns
-- ============================================================================

-- Drop and recreate the table to ensure it has all required columns
DROP TABLE IF EXISTS public.otp_verifications CASCADE;

CREATE TABLE public.otp_verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  otp_code text NOT NULL,
  user_type text NOT NULL DEFAULT 'buyer',
  purpose text NOT NULL DEFAULT 'verification',
  expires_at timestamp with time zone NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamp with time zone,
  attempts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_verifications_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX idx_otp_verifications_email ON public.otp_verifications(email);
CREATE INDEX idx_otp_verifications_email_purpose ON public.otp_verifications(email, purpose);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);
CREATE INDEX idx_otp_verifications_is_used ON public.otp_verifications(is_used);

-- Enable Row Level Security (RLS)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for OTP operations
CREATE POLICY "Allow OTP insert for all users" ON public.otp_verifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow OTP select for all users" ON public.otp_verifications
FOR SELECT USING (true);

CREATE POLICY "Allow OTP update for all users" ON public.otp_verifications
FOR UPDATE USING (true);

-- Create a function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_otp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_otp_updated_at
  BEFORE UPDATE ON public.otp_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_otp_updated_at();

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'otp_verifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'otp_verifications' 
  AND schemaname = 'public';

-- Success message
SELECT 'OTP verifications table created successfully with all required columns!' as status;

