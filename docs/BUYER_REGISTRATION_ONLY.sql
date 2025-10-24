-- ChiFere App - Buyer Registration Only SQL Script
-- This script sets up only the essential tables for buyer registration and authentication

-- ============================================================================
-- AUTHENTICATION TABLES FOR BUYERS
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

-- Buyer Users Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS buyer_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  user_type TEXT DEFAULT 'buyer',
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'buyer' or 'seller'
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- OTP indexes
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);

-- Buyer user indexes
CREATE INDEX IF NOT EXISTS idx_buyer_users_email ON buyer_users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(user_type);

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
    middle_name,
    phone,
    is_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'middle_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create buyer user after profile creation
CREATE OR REPLACE FUNCTION create_buyer_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create buyer user if user_type is 'buyer'
  IF NEW.user_type = 'buyer' THEN
    INSERT INTO buyer_users (
      id,
      email,
      display_name,
      first_name,
      last_name,
      middle_name,
      phone,
      is_verified
    ) VALUES (
      NEW.id,
      NEW.email,
      NEW.display_name,
      NEW.first_name,
      NEW.last_name,
      NEW.middle_name,
      NEW.phone,
      NEW.is_verified
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
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

-- Trigger to create buyer user when profile is created
CREATE OR REPLACE TRIGGER on_user_profile_created
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_buyer_user();

-- Trigger to update updated_at
CREATE OR REPLACE TRIGGER update_buyer_users_updated_at 
  BEFORE UPDATE ON buyer_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_users ENABLE ROW LEVEL SECURITY;
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

-- Buyer users policies
CREATE POLICY "Users can view their own buyer profile" ON buyer_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own buyer profile" ON buyer_users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own buyer profile" ON buyer_users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('otp_verifications', 'buyer_users', 'user_profiles');

-- Check if policies are enabled
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('otp_verifications', 'buyer_users', 'user_profiles');

-- ============================================================================
-- NOTES
-- ============================================================================

-- This script only includes:
-- 1. OTP verification for email confirmation
-- 2. User profiles table (general)
-- 3. Buyer users table (buyer-specific)
-- 4. Essential functions and triggers
-- 5. Row Level Security policies
-- 
-- Shopping cart, orders, and payment tables are NOT included
-- These will be added later when needed for the full marketplace functionality


-- This script sets up only the essential tables for buyer registration and authentication

-- ============================================================================
-- AUTHENTICATION TABLES FOR BUYERS
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

-- Buyer Users Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS buyer_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  user_type TEXT DEFAULT 'buyer',
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'buyer' or 'seller'
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- OTP indexes
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);

-- Buyer user indexes
CREATE INDEX IF NOT EXISTS idx_buyer_users_email ON buyer_users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(user_type);

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
    middle_name,
    phone,
    is_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'middle_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create buyer user after profile creation
CREATE OR REPLACE FUNCTION create_buyer_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create buyer user if user_type is 'buyer'
  IF NEW.user_type = 'buyer' THEN
    INSERT INTO buyer_users (
      id,
      email,
      display_name,
      first_name,
      last_name,
      middle_name,
      phone,
      is_verified
    ) VALUES (
      NEW.id,
      NEW.email,
      NEW.display_name,
      NEW.first_name,
      NEW.last_name,
      NEW.middle_name,
      NEW.phone,
      NEW.is_verified
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
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

-- Trigger to create buyer user when profile is created
CREATE OR REPLACE TRIGGER on_user_profile_created
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_buyer_user();

-- Trigger to update updated_at
CREATE OR REPLACE TRIGGER update_buyer_users_updated_at 
  BEFORE UPDATE ON buyer_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_users ENABLE ROW LEVEL SECURITY;
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

-- Buyer users policies
CREATE POLICY "Users can view their own buyer profile" ON buyer_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own buyer profile" ON buyer_users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own buyer profile" ON buyer_users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('otp_verifications', 'buyer_users', 'user_profiles');

-- Check if policies are enabled
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('otp_verifications', 'buyer_users', 'user_profiles');

-- ============================================================================
-- NOTES
-- ============================================================================

-- This script only includes:
-- 1. OTP verification for email confirmation
-- 2. User profiles table (general)
-- 3. Buyer users table (buyer-specific)
-- 4. Essential functions and triggers
-- 5. Row Level Security policies
-- 
-- Shopping cart, orders, and payment tables are NOT included
-- These will be added later when needed for the full marketplace functionality




























