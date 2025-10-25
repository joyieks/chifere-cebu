-- FIND MISSING PRODUCTS
-- This will help us find where the "missing" products actually exist

-- Step 1: Check what products exist in the products table
SELECT '=== PRODUCTS IN PRODUCTS TABLE ===' as info;
SELECT 
    id,
    name,
    seller_id,
    product_type,
    status
FROM products
WHERE name IN ('Laptop', 'Bottle', 'Comb', 'Guitar', 'Truck')
ORDER BY name;

-- Step 2: Check if they exist in seller_add_item_preloved
SELECT '=== PRODUCTS IN SELLER_ADD_ITEM_PRELOVED ===' as info;
SELECT 
    id,
    name,
    seller_id,
    product_type,
    status
FROM seller_add_item_preloved
WHERE name IN ('Laptop', 'Bottle', 'Comb', 'Guitar', 'Truck')
ORDER BY name;

-- Step 3: Check if they exist in seller_add_barter_item
SELECT '=== PRODUCTS IN SELLER_ADD_BARTER_ITEM ===' as info;
SELECT 
    id,
    name,
    seller_id,
    product_type,
    status
FROM seller_add_barter_item
WHERE name IN ('Laptop', 'Bottle', 'Comb', 'Guitar', 'Truck')
ORDER BY name;

-- Step 4: Check all products by name pattern
SELECT '=== ALL PRODUCTS WITH SIMILAR NAMES ===' as info;
SELECT 
    'products' as table_name,
    id,
    name,
    seller_id,
    product_type
FROM products
WHERE name ILIKE '%laptop%' OR name ILIKE '%bottle%' OR name ILIKE '%comb%'
UNION ALL
SELECT 
    'seller_add_item_preloved' as table_name,
    id,
    name,
    seller_id,
    product_type
FROM seller_add_item_preloved
WHERE name ILIKE '%laptop%' OR name ILIKE '%bottle%' OR name ILIKE '%comb%'
UNION ALL
SELECT 
    'seller_add_barter_item' as table_name,
    id,
    name,
    seller_id,
    product_type
FROM seller_add_barter_item
WHERE name ILIKE '%laptop%' OR name ILIKE '%bottle%' OR name ILIKE '%comb%'
ORDER BY name;

-- Step 5: Check the specific product IDs from order items
SELECT '=== CHECKING SPECIFIC PRODUCT IDs FROM ORDER ITEMS ===' as info;
SELECT 
    'products' as table_name,
    id,
    name,
    seller_id
FROM products
WHERE id IN (
    '188b8f91-317f-4448-b734-e0c9d538c2ac',  -- Laptop
    '599e0cf8-0f60-4c76-99d3-294f4b47629e',  -- Bottle
    'd44cfce3-e215-4ab2-adb5-da0f16d3c94a',  -- Guitar
    '0098b64e-58e2-405b-9e6e-85cc9b075167'   -- Truck
)
UNION ALL
SELECT 
    'seller_add_item_preloved' as table_name,
    id,
    name,
    seller_id
FROM seller_add_item_preloved
WHERE id IN (
    '188b8f91-317f-4448-b734-e0c9d538c2ac',  -- Laptop
    '599e0cf8-0f60-4c76-99d3-294f4b47629e',  -- Bottle
    'd44cfce3-e215-4ab2-adb5-da0f16d3c94a',  -- Guitar
    '0098b64e-58e2-405b-9e6e-85cc9b075167'   -- Truck
)
UNION ALL
SELECT 
    'seller_add_barter_item' as table_name,
    id,
    name,
    seller_id
FROM seller_add_barter_item
WHERE id IN (
    '188b8f91-317f-4448-b734-e0c9d538c2ac',  -- Laptop
    '599e0cf8-0f60-4c76-99d3-294f4b47629e',  -- Bottle
    'd44cfce3-e215-4ab2-adb5-da0f16d3c94a',  -- Guitar
    '0098b64e-58e2-405b-9e6e-85cc9b075167'   -- Truck
)
ORDER BY name;
