-- TEST ORDER CREATION
-- Let's see if we can create a test order to understand the issue

-- Step 1: Check what users exist that we can use for testing
SELECT '=== AVAILABLE USERS FOR TESTING ===' as info;

SELECT 'Buyer users:' as info;
SELECT 
    id,
    email,
    display_name,
    user_type
FROM buyer_users 
LIMIT 5;

SELECT 'User profiles (potential sellers):' as info;
SELECT 
    id,
    email,
    display_name,
    user_type,
    seller_status
FROM user_profiles 
WHERE user_type = 'seller' OR seller_status IS NOT NULL
LIMIT 5;

-- Step 2: Check what products exist
SELECT '=== AVAILABLE PRODUCTS ===' as info;

SELECT 'Products with their sellers:' as info;
SELECT 
    p.id,
    p.name,
    p.seller_id,
    up.email as seller_email,
    up.display_name as seller_name
FROM products p
LEFT JOIN user_profiles up ON p.seller_id = up.id
LIMIT 10;

-- Step 3: Try to create a test order in buyer_orders
SELECT '=== TESTING ORDER CREATION ===' as info;

-- First, let's see if we can insert a test order
-- We'll use the first available buyer and seller

-- Get a buyer
SELECT 'Available buyer for test:' as info;
SELECT id, email FROM buyer_users LIMIT 1;

-- Get a seller
SELECT 'Available seller for test:' as info;
SELECT id, email FROM user_profiles WHERE user_type = 'seller' OR seller_status IS NOT NULL LIMIT 1;

-- Get a product
SELECT 'Available product for test:' as info;
SELECT id, name, seller_id FROM products LIMIT 1;

-- Step 4: Check the current state of order items
SELECT '=== CURRENT ORDER ITEMS STATE ===' as info;

SELECT 'buyer_order_items sample:' as info;
SELECT 
    id,
    order_id,
    product_id,
    seller_id,
    product_name,
    quantity,
    total_price
FROM buyer_order_items 
LIMIT 5;

SELECT 'order_items sample:' as info;
SELECT 
    id,
    order_id,
    product_id,
    seller_id,
    product_name,
    quantity,
    total_price
FROM order_items 
LIMIT 5;

-- Step 5: Check if there are any relationships between orders and order items
SELECT '=== ORDER-ORDER_ITEMS RELATIONSHIPS ===' as info;

SELECT 'Orders with their items (buyer_orders):' as info;
SELECT 
    bo.id as order_id,
    bo.order_number,
    bo.seller_id as order_seller_id,
    boi.id as item_id,
    boi.seller_id as item_seller_id,
    boi.product_name
FROM buyer_orders bo
LEFT JOIN buyer_order_items boi ON bo.id = boi.order_id
LIMIT 10;

SELECT 'Orders with their items (orders):' as info;
SELECT 
    o.id as order_id,
    o.order_number,
    o.seller_id as order_seller_id,
    oi.id as item_id,
    oi.seller_id as item_seller_id,
    oi.product_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LIMIT 10;

SELECT '=== TEST COMPLETE ===' as status;
