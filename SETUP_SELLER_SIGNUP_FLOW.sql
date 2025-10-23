-- ============================================================================
-- SELLER SIGNUP FLOW SETUP
-- This script sets up the complete seller signup flow with OTP verification
-- ============================================================================

-- Create OTP verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'seller',
  purpose TEXT NOT NULL DEFAULT 'verification',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_code ON otp_verifications(otp_code);

-- Ensure user_profiles table has all required columns for seller signup
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS id_type TEXT,
ADD COLUMN IF NOT EXISTS id_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_back_url TEXT,
ADD COLUMN IF NOT EXISTS seller_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Create admin_activities table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  target_type TEXT, -- 'user', 'seller', 'product', etc.
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for admin activities
CREATE INDEX IF NOT EXISTS idx_admin_activities_admin_id ON admin_activities(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activities_created_at ON admin_activities(created_at);

-- Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications 
  WHERE expires_at < NOW() 
     OR (is_used = true AND created_at < NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Create function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id UUID,
  p_action TEXT,
  p_description TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_activities (admin_id, action, description, target_type, target_id, metadata)
  VALUES (p_admin_id, p_action, p_description, p_target_type, p_target_id, p_metadata);
END;
$$ LANGUAGE plpgsql;

-- Verify tables exist and show structure
SELECT 
  'otp_verifications' as table_name,
  COUNT(*) as record_count
FROM otp_verifications
UNION ALL
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as record_count
FROM user_profiles
UNION ALL
SELECT 
  'admin_activities' as table_name,
  COUNT(*) as record_count
FROM admin_activities;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE 'Seller signup flow setup completed successfully!';
  RAISE NOTICE 'Tables created/verified: otp_verifications, user_profiles, admin_activities';
  RAISE NOTICE 'Functions created: cleanup_expired_otps, log_admin_activity';
END $$;

