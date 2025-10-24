-- EMERGENCY DEBUG - LET'S SEE WHAT'S REALLY HAPPENING

-- Step 1: Check if there are ANY orders at all
SELECT 'DO ORDERS EXIST?' as question;
SELECT COUNT(*) as total_orders FROM buyer_orders;

-- Step 2: Check if there are ANY order items at all
SELECT 'DO ORDER ITEMS EXIST?' as question;
SELECT COUNT(*) as total_items FROM buyer_order_items;

-- Step 3: Show ALL orders with their seller_id
SELECT 'ALL ORDERS AND THEIR SELLER_ID:' as info;
SELECT 
    id,
    order_number,
    seller_id,
    CASE 
        WHEN seller_id IS NULL THEN 'NULL'
        WHEN seller_id = '00000000-0000-0000-0000-000000000000' THEN 'ZERO_UUID'
        ELSE 'HAS_VALUE'
    END as seller_id_status
FROM buyer_orders;

-- Step 4: Show ALL order items with their seller_id
SELECT 'ALL ORDER ITEMS AND THEIR SELLER_ID:' as info;
SELECT 
    order_id,
    seller_id,
    product_name,
    CASE 
        WHEN seller_id IS NULL THEN 'NULL'
        WHEN seller_id = '00000000-0000-0000-0000-000000000000' THEN 'ZERO_UUID'
        ELSE 'HAS_VALUE'
    END as seller_id_status
FROM buyer_order_items;

-- Step 5: Check if there are any users at all
SELECT 'DO USERS EXIST?' as question;
SELECT COUNT(*) as total_users FROM user_profiles;

-- Step 6: Show some users
SELECT 'SOME USERS:' as info;
SELECT id, email, user_type, seller_status FROM user_profiles LIMIT 5;

-- Step 7: Check if there are any products
SELECT 'DO PRODUCTS EXIST?' as question;
SELECT COUNT(*) as total_products FROM products;

-- Step 8: Show some products with their sellers
SELECT 'SOME PRODUCTS WITH SELLERS:' as info;
SELECT id, name, seller_id FROM products LIMIT 5;
