-- DEBUG ORDERS ISSUE
-- Let's see exactly what's in your database

-- Step 1: Check if there are any orders at all
SELECT '=== CHECKING IF ORDERS EXIST ===' as info;

SELECT 'Total orders in buyer_orders:' as info;
SELECT COUNT(*) as total_orders FROM buyer_orders;

SELECT 'Total orders in orders:' as info;
SELECT COUNT(*) as total_orders FROM orders;

-- Step 2: Check if there are any order items
SELECT '=== CHECKING ORDER ITEMS ===' as info;

SELECT 'Total items in buyer_order_items:' as info;
SELECT COUNT(*) as total_items FROM buyer_order_items;

SELECT 'Total items in order_items:' as info;
SELECT COUNT(*) as total_items FROM order_items;

-- Step 3: Check seller_ids in order items
SELECT '=== SELLER IDs IN ORDER ITEMS ===' as info;

SELECT 'Seller IDs in buyer_order_items (with counts):' as info;
SELECT 
    seller_id,
    COUNT(*) as item_count,
    COUNT(DISTINCT order_id) as order_count
FROM buyer_order_items 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY item_count DESC;

SELECT 'Seller IDs in order_items (with counts):' as info;
SELECT 
    seller_id,
    COUNT(*) as item_count,
    COUNT(DISTINCT order_id) as order_count
FROM order_items 
WHERE seller_id IS NOT NULL
GROUP BY seller_id
ORDER BY item_count DESC;

-- Step 4: Check what orders exist and their seller_id status
SELECT '=== ORDERS AND THEIR SELLER_ID STATUS ===' as info;

SELECT 'buyer_orders with seller_id status:' as info;
SELECT 
    CASE 
        WHEN seller_id IS NULL THEN 'NULL'
        ELSE 'HAS_VALUE'
    END as seller_id_status,
    COUNT(*) as count
FROM buyer_orders
GROUP BY 
    CASE 
        WHEN seller_id IS NULL THEN 'NULL'
        ELSE 'HAS_VALUE'
    END;

SELECT 'orders with seller_id status:' as info;
SELECT 
    CASE 
        WHEN seller_id IS NULL THEN 'NULL'
        ELSE 'HAS_VALUE'
    END as seller_id_status,
    COUNT(*) as count
FROM orders
GROUP BY 
    CASE 
        WHEN seller_id IS NULL THEN 'NULL'
        ELSE 'HAS_VALUE'
    END;

-- Step 5: Show actual orders that exist
SELECT '=== ACTUAL ORDERS THAT EXIST ===' as info;

SELECT 'First 10 buyer_orders:' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
ORDER BY created_at DESC
LIMIT 10;

SELECT 'First 10 orders:' as info;
SELECT 
    id,
    order_number,
    buyer_id,
    seller_id,
    status,
    total_amount,
    created_at
FROM orders 
ORDER BY created_at DESC
LIMIT 10;

-- Step 6: Check if there are any users/sellers
SELECT '=== CHECKING USERS/SELLERS ===' as info;

SELECT 'Total users in user_profiles:' as info;
SELECT COUNT(*) as total_users FROM user_profiles;

SELECT 'Total users in buyer_users:' as info;
SELECT COUNT(*) as total_buyers FROM buyer_users;

SELECT 'First 10 user_profiles:' as info;
SELECT 
    id,
    email,
    user_type,
    display_name,
    seller_status
FROM user_profiles 
LIMIT 10;

-- Step 7: Check if there are any products
SELECT '=== CHECKING PRODUCTS ===' as info;

SELECT 'Total products:' as info;
SELECT COUNT(*) as total_products FROM products;

SELECT 'Products by seller:' as info;
SELECT 
    seller_id,
    COUNT(*) as product_count
FROM products
GROUP BY seller_id
ORDER BY product_count DESC;

SELECT '=== DEBUG COMPLETE ===' as status;
