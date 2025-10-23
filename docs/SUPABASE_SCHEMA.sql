-- ChiFere App - Supabase Database Schema
-- Version: 2.0.0
-- Date: October 14, 2025

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER TABLES
-- ============================================================================

-- Buyer Users Table
CREATE TABLE IF NOT EXISTS buyer_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  user_type TEXT DEFAULT 'buyer',
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller Users Table
CREATE TABLE IF NOT EXISTS seller_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  user_type TEXT DEFAULT 'seller',
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,

  -- Business Information
  business_name TEXT,
  business_description TEXT,
  business_category TEXT,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  is_business_verified BOOLEAN DEFAULT FALSE,

  -- KYC Fields
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
-- ITEM/PRODUCT TABLES
-- ============================================================================

-- Preloved Items (for sale)
CREATE TABLE IF NOT EXISTS seller_add_item_preloved (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES seller_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC,
  condition TEXT,
  location TEXT,
  images TEXT[],
  status TEXT DEFAULT 'active', -- active, sold, inactive
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_barter_only BOOLEAN DEFAULT FALSE,
  is_sell_only BOOLEAN DEFAULT TRUE,
  is_both BOOLEAN DEFAULT FALSE,
  barter_requests JSONB DEFAULT '[]'::jsonb,
  barter_offers JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Barter Items (barter only)
CREATE TABLE IF NOT EXISTS seller_add_barter_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES seller_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  estimated_value NUMERIC,
  condition TEXT,
  location TEXT,
  images TEXT[],
  status TEXT DEFAULT 'active', -- active, bartered, inactive
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_barter_only BOOLEAN DEFAULT TRUE,
  is_sell_only BOOLEAN DEFAULT FALSE,
  is_both BOOLEAN DEFAULT FALSE,
  barter_requests JSONB DEFAULT '[]'::jsonb,
  barter_offers JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  bartered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CART AND ORDERS
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
  seller_id UUID REFERENCES seller_users(id),
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

-- ============================================================================
-- BARTER SYSTEM
-- ============================================================================

-- Barter Offers
CREATE TABLE IF NOT EXISTS buyer_barter_offer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES buyer_users(id),
  owner_id UUID REFERENCES seller_users(id),
  original_item_id UUID,
  original_item JSONB,
  offered_items JSONB,
  status TEXT DEFAULT 'pending', -- pending, counter_offered, accepted, rejected, completed, cancelled
  current_offer_id TEXT,
  negotiations JSONB DEFAULT '[]'::jsonb,
  conversation_id UUID,
  message TEXT,
  delivery_status TEXT,
  delivery_id UUID,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  cancellation_reason TEXT,
  rejection_reason TEXT,
  rejected_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MESSAGING
-- ============================================================================

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participants UUID[] NOT NULL,
  item_id UUID,
  item_data JSONB,
  last_message TEXT,
  unread_count JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, image, offer, system
  attachments TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  read_by UUID[],
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- order, barter, message, system
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  is_actionable BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DELIVERY
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES buyer_order_item(id),
  barter_id UUID REFERENCES buyer_barter_offer(id),
  tracking_number TEXT,
  courier TEXT, -- lalamove, jnt, etc.
  courier_tracking_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, picked_up, in_transit, out_for_delivery, delivered, failed
  pickup JSONB,
  dropoff JSONB,
  estimated_delivery TIMESTAMPTZ,
  status_history JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- ============================================================================
-- PAYMENT METHODS
-- ============================================================================

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

-- Seller Payment Methods
CREATE TABLE IF NOT EXISTS seller_payment_method (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES seller_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- bank_account, gcash, paymaya
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  ewallet_number TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_buyer_users_email ON buyer_users(email);
CREATE INDEX idx_seller_users_email ON seller_users(email);
CREATE INDEX idx_seller_users_kyc_status ON seller_users(kyc_status);

-- Item indexes
CREATE INDEX idx_preloved_seller ON seller_add_item_preloved(seller_id);
CREATE INDEX idx_preloved_status ON seller_add_item_preloved(status);
CREATE INDEX idx_preloved_category ON seller_add_item_preloved(category);
CREATE INDEX idx_barter_seller ON seller_add_barter_item(seller_id);
CREATE INDEX idx_barter_status ON seller_add_barter_item(status);
CREATE INDEX idx_barter_category ON seller_add_barter_item(category);

-- Cart index
CREATE INDEX idx_cart_user ON buyer_add_to_cart(user_id);

-- Order indexes
CREATE INDEX idx_orders_buyer ON buyer_order_item(buyer_id);
CREATE INDEX idx_orders_seller ON buyer_order_item(seller_id);
CREATE INDEX idx_orders_status ON buyer_order_item(payment_status, delivery_status);

-- Barter indexes
CREATE INDEX idx_barter_requester ON buyer_barter_offer(requester_id);
CREATE INDEX idx_barter_owner ON buyer_barter_offer(owner_id);
CREATE INDEX idx_barter_status ON buyer_barter_offer(status);

-- Messaging indexes
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- Delivery indexes
CREATE INDEX idx_delivery_order ON delivery(order_id);
CREATE INDEX idx_delivery_barter ON delivery(barter_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_buyer_users_updated_at BEFORE UPDATE ON buyer_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_users_updated_at BEFORE UPDATE ON seller_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preloved_updated_at BEFORE UPDATE ON seller_add_item_preloved FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barter_item_updated_at BEFORE UPDATE ON seller_add_barter_item FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON buyer_add_to_cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON buyer_order_item FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barter_offer_updated_at BEFORE UPDATE ON buyer_barter_offer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_updated_at BEFORE UPDATE ON delivery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_payment_updated_at BEFORE UPDATE ON buyer_payment_method FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_payment_updated_at BEFORE UPDATE ON seller_payment_method FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();




