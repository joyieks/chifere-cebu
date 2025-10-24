-- ChiFere App - Buyer Setup SQL Script
-- This script sets up the database for buyer authentication and profiles

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
-- BUYER-SPECIFIC TABLES
-- ============================================================================

-- Shopping Cart
CREATE TABLE IF NOT EXISTS buyer_add_to_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES buyer_users(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS buyer_order_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES buyer_users(id),
  seller_id UUID,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  delivery_status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  delivery_address JSONB,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Buyer Payment Methods
CREATE TABLE IF NOT EXISTS buyer_payment_method (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES buyer_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- card, bank, ewallet
  provider TEXT, -- paymongo, gcash, paymaya
  payment_token TEXT,
  last_four TEXT,
  card_brand TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  billing_details JSONB,
  last_used_at TIMESTAMPTZ,
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

-- Cart and order indexes
CREATE INDEX IF NOT EXISTS idx_cart_user ON buyer_add_to_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON buyer_order_item(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON buyer_order_item(payment_status, delivery_status);

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
ALTER TABLE buyer_add_to_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_payment_method ENABLE ROW LEVEL SECURITY;

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

-- Cart policies
CREATE POLICY "Users can manage their own cart" ON buyer_add_to_cart
  FOR ALL USING (user_id = auth.uid());

-- Order policies
CREATE POLICY "Users can view their own orders" ON buyer_order_item
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Users can create their own orders" ON buyer_order_item
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Payment method policies
CREATE POLICY "Users can manage their own payment methods" ON buyer_payment_method
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample buyer (for testing - remove in production)
-- INSERT INTO buyer_users (email, display_name, first_name, last_name, phone, is_verified)
-- VALUES ('test@example.com', 'Test Buyer', 'Test', 'Buyer', '+1234567890', true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('otp_verifications', 'buyer_users', 'user_profiles', 'buyer_add_to_cart', 'buyer_order_item', 'buyer_payment_method');

-- Check if policies are enabled
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('otp_verifications', 'buyer_users', 'user_profiles', 'buyer_add_to_cart', 'buyer_order_item', 'buyer_payment_method');


-- This script sets up the database for buyer authentication and profiles

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
-- BUYER-SPECIFIC TABLES
-- ============================================================================

-- Shopping Cart
CREATE TABLE IF NOT EXISTS buyer_add_to_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES buyer_users(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS buyer_order_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES buyer_users(id),
  seller_id UUID,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  delivery_status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  delivery_address JSONB,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Buyer Payment Methods
CREATE TABLE IF NOT EXISTS buyer_payment_method (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES buyer_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- card, bank, ewallet
  provider TEXT, -- paymongo, gcash, paymaya
  payment_token TEXT,
  last_four TEXT,
  card_brand TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  billing_details JSONB,
  last_used_at TIMESTAMPTZ,
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

-- Cart and order indexes
CREATE INDEX IF NOT EXISTS idx_cart_user ON buyer_add_to_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON buyer_order_item(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON buyer_order_item(payment_status, delivery_status);

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
ALTER TABLE buyer_add_to_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_payment_method ENABLE ROW LEVEL SECURITY;

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

-- Cart policies
CREATE POLICY "Users can manage their own cart" ON buyer_add_to_cart
  FOR ALL USING (user_id = auth.uid());

-- Order policies
CREATE POLICY "Users can view their own orders" ON buyer_order_item
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Users can create their own orders" ON buyer_order_item
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Payment method policies
CREATE POLICY "Users can manage their own payment methods" ON buyer_payment_method
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample buyer (for testing - remove in production)
-- INSERT INTO buyer_users (email, display_name, first_name, last_name, phone, is_verified)
-- VALUES ('test@example.com', 'Test Buyer', 'Test', 'Buyer', '+1234567890', true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('otp_verifications', 'buyer_users', 'user_profiles', 'buyer_add_to_cart', 'buyer_order_item', 'buyer_payment_method');

-- Check if policies are enabled
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('otp_verifications', 'buyer_users', 'user_profiles', 'buyer_add_to_cart', 'buyer_order_item', 'buyer_payment_method');




























