-- ChiFere App - Authentication Setup
-- This script sets up authentication tables and RLS policies

-- ============================================================================
-- AUTHENTICATION TABLES
-- ============================================================================

-- OTP Verification Table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'buyer' or 'seller'
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'buyer' or 'seller'
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Seller specific fields
  business_name TEXT,
  business_description TEXT,
  business_category TEXT,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  is_business_verified BOOLEAN DEFAULT FALSE,
  
  -- KYC Fields for sellers
  kyc_status TEXT DEFAULT 'none', -- none, pending, approved, rejected
  kyc_documents JSONB DEFAULT '{}'::jsonb,
  kyc_submitted_at TIMESTAMPTZ,
  kyc_reviewed_at TIMESTAMPTZ,
  
  -- Metrics
  rating NUMERIC DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- OTP indexes
CREATE INDEX idx_otp_email ON otp_verifications(email);
CREATE INDEX idx_otp_code ON otp_verifications(otp_code);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);

-- User profile indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_kyc_status ON user_profiles(kyc_status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications 
  WHERE expires_at < NOW() OR is_used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    id,
    email,
    user_type,
    display_name,
    first_name,
    last_name,
    is_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to create user profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Trigger to update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- OTP policies
CREATE POLICY "Users can insert their own OTP" ON otp_verifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own OTP" ON otp_verifications
  FOR SELECT USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own OTP" ON otp_verifications
  FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Public read access for basic profile info (for marketplace)
CREATE POLICY "Public can view basic profile info" ON user_profiles
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- CLEANUP JOB (Optional - for production)
-- ============================================================================

-- Create a function to clean up expired OTPs (run this periodically)
-- You can set up a cron job or use pg_cron extension
-- SELECT cron.schedule('cleanup-otps', '*/5 * * * *', 'SELECT cleanup_expired_otps();');

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample OTP (for testing)
-- INSERT INTO otp_verifications (email, otp_code, user_type, expires_at)
-- VALUES ('test@example.com', '123456', 'buyer', NOW() + INTERVAL '10 minutes');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('otp_verifications', 'user_profiles');

-- Check if policies are enabled
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('otp_verifications', 'user_profiles');


-- This script sets up authentication tables and RLS policies

-- ============================================================================
-- AUTHENTICATION TABLES
-- ============================================================================

-- OTP Verification Table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'buyer' or 'seller'
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'buyer' or 'seller'
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Seller specific fields
  business_name TEXT,
  business_description TEXT,
  business_category TEXT,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  is_business_verified BOOLEAN DEFAULT FALSE,
  
  -- KYC Fields for sellers
  kyc_status TEXT DEFAULT 'none', -- none, pending, approved, rejected
  kyc_documents JSONB DEFAULT '{}'::jsonb,
  kyc_submitted_at TIMESTAMPTZ,
  kyc_reviewed_at TIMESTAMPTZ,
  
  -- Metrics
  rating NUMERIC DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- OTP indexes
CREATE INDEX idx_otp_email ON otp_verifications(email);
CREATE INDEX idx_otp_code ON otp_verifications(otp_code);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);

-- User profile indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_kyc_status ON user_profiles(kyc_status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications 
  WHERE expires_at < NOW() OR is_used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    id,
    email,
    user_type,
    display_name,
    first_name,
    last_name,
    is_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to create user profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Trigger to update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- OTP policies
CREATE POLICY "Users can insert their own OTP" ON otp_verifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own OTP" ON otp_verifications
  FOR SELECT USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own OTP" ON otp_verifications
  FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Public read access for basic profile info (for marketplace)
CREATE POLICY "Public can view basic profile info" ON user_profiles
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- CLEANUP JOB (Optional - for production)
-- ============================================================================

-- Create a function to clean up expired OTPs (run this periodically)
-- You can set up a cron job or use pg_cron extension
-- SELECT cron.schedule('cleanup-otps', '*/5 * * * *', 'SELECT cleanup_expired_otps();');

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample OTP (for testing)
-- INSERT INTO otp_verifications (email, otp_code, user_type, expires_at)
-- VALUES ('test@example.com', '123456', 'buyer', NOW() + INTERVAL '10 minutes');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('otp_verifications', 'user_profiles');

-- Check if policies are enabled
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('otp_verifications', 'user_profiles');




























