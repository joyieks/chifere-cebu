-- ============================================================================
-- CHECKOUT SAMPLE DATA
-- Safe sample data insertion for checkout functionality
-- ============================================================================

-- This script should be run AFTER the main database setup
-- It safely inserts sample data only if the required tables exist

-- ============================================================================
-- SAMPLE BUYER USER
-- ============================================================================

-- Sample buyer user creation has been removed to prevent hardcoded test data
-- If you need test data, create it manually or use the seed scripts

-- ============================================================================
-- SAMPLE ADDRESSES
-- ============================================================================

-- Create sample addresses if buyer_addresses table exists
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if buyer_addresses table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buyer_addresses') THEN
    -- Check if the sample user exists
    SELECT EXISTS(SELECT 1 FROM buyer_users WHERE id = '00000000-0000-0000-0000-000000000001') INTO user_exists;
    
    IF user_exists THEN
      -- Insert sample addresses
      INSERT INTO buyer_addresses (user_id, type, name, phone, address_line_1, city, province, zip_code, is_default)
      VALUES 
        ('00000000-0000-0000-0000-000000000001', 'home', 'Joan Joy Diocampo', '(+63) 9981921194', '7th street Hagdanan, San Antonio Village', 'Cebu City', 'Cebu', '6000', TRUE),
        ('00000000-0000-0000-0000-000000000001', 'work', 'Joan Joy Diocampo', '(+63) 9981921194', 'IT Park, Lahug', 'Cebu City', 'Cebu', '6000', FALSE)
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Sample addresses created or already exist';
    ELSE
      RAISE NOTICE 'Sample buyer user does not exist. Please run the buyer user creation first.';
    END IF;
  ELSE
    RAISE NOTICE 'buyer_addresses table does not exist. Please run the main database setup first.';
  END IF;
END $$;

-- ============================================================================
-- SAMPLE ORDERS (Optional)
-- ============================================================================

-- Create sample orders if buyer_orders table exists
DO $$
DECLARE
  user_exists BOOLEAN;
  order_count INTEGER;
BEGIN
  -- Check if buyer_orders table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buyer_orders') THEN
    -- Check if the sample user exists
    SELECT EXISTS(SELECT 1 FROM buyer_users WHERE id = '00000000-0000-0000-0000-000000000001') INTO user_exists;
    
    IF user_exists THEN
      -- Check if orders already exist
      SELECT COUNT(*) INTO order_count FROM buyer_orders WHERE buyer_id = '00000000-0000-0000-0000-000000000001';
      
      IF order_count = 0 THEN
        -- Insert sample order (with generic seller_id if seller_users doesn't exist)
        INSERT INTO buyer_orders (
          order_number, buyer_id, seller_id, status, payment_status, delivery_status,
          items, subtotal, delivery_fee, total_amount, payment_method,
          delivery_address, created_at
        ) VALUES (
          generate_order_number(),
          '00000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000002', -- Use valid UUID format
          'pending',
          'pending',
          'pending',
          '[{"id": "sample_item_1", "name": "Sample Product", "price": 1000, "quantity": 1}]'::jsonb,
          1000,
          150,
          1150,
          'cod',
          '{"name": "Joan Joy Diocampo", "phone": "(+63) 9981921194", "address": "7th street Hagdanan, San Antonio Village, Cebu City, Cebu 6000"}'::jsonb,
          NOW()
        );
        
        RAISE NOTICE 'Sample order created';
      ELSE
        RAISE NOTICE 'Sample orders already exist';
      END IF;
    ELSE
      RAISE NOTICE 'Sample buyer user does not exist. Please run the buyer user creation first.';
    END IF;
  ELSE
    RAISE NOTICE 'buyer_orders table does not exist. Please run the main database setup first.';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Display summary of created data
DO $$
DECLARE
  user_count INTEGER;
  address_count INTEGER;
  order_count INTEGER;
BEGIN
  -- Count created data
  SELECT COUNT(*) INTO user_count FROM buyer_users WHERE id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO address_count FROM buyer_addresses WHERE user_id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO order_count FROM buyer_orders WHERE buyer_id = '00000000-0000-0000-0000-000000000001';
  
  RAISE NOTICE '=== SAMPLE DATA SUMMARY ===';
  RAISE NOTICE 'Sample Users: %', user_count;
  RAISE NOTICE 'Sample Addresses: %', address_count;
  RAISE NOTICE 'Sample Orders: %', order_count;
  RAISE NOTICE '========================';
END $$;
