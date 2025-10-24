-- REMOVE ORDERS NOT BELONGING TO CURRENT SELLER
-- This script will delete orders that don't contain products from the current seller

-- Step 1: Show what products belong to the current seller
SELECT 'Products belonging to current seller:' as info;
SELECT 
    'products' as table_name,
    id,
    name,
    seller_id,
    created_at
FROM products 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
UNION ALL
SELECT 
    'seller_add_item_preloved' as table_name,
    id,
    name,
    seller_id,
    created_at
FROM seller_add_item_preloved 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
UNION ALL
SELECT 
    'seller_add_barter_item' as table_name,
    id,
    name,
    seller_id,
    created_at
FROM seller_add_barter_item 
WHERE seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e';

-- Step 2: Show orders that will be KEPT (contain products from current seller)
SELECT 'Orders that will be KEPT (contain products from current seller):' as info;
SELECT DISTINCT
    bo.order_number,
    bo.seller_id as current_seller_id,
    boi.product_id,
    boi.product_name,
    p.seller_id as product_seller_id,
    bo.created_at,
    'KEEP' as action
FROM buyer_orders bo
JOIN buyer_order_items boi ON bo.id = boi.order_id
LEFT JOIN products p ON boi.product_id::uuid = p.id
WHERE p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'

UNION ALL

SELECT DISTINCT
    bo.order_number,
    bo.seller_id as current_seller_id,
    boi.product_id,
    boi.product_name,
    sap.seller_id as product_seller_id,
    bo.created_at,
    'KEEP' as action
FROM buyer_orders bo
JOIN buyer_order_items boi ON bo.id = boi.order_id
LEFT JOIN seller_add_item_preloved sap ON boi.product_id::uuid = sap.id
WHERE sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'

UNION ALL

SELECT DISTINCT
    bo.order_number,
    bo.seller_id as current_seller_id,
    boi.product_id,
    boi.product_name,
    sab.seller_id as product_seller_id,
    bo.created_at,
    'KEEP' as action
FROM buyer_orders bo
JOIN buyer_order_items boi ON bo.id = boi.order_id
LEFT JOIN seller_add_barter_item sab ON boi.product_id::uuid = sab.id
WHERE sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
ORDER BY created_at DESC;

-- Step 3: Show orders that will be DELETED (don't contain products from current seller)
SELECT 'Orders that will be DELETED (don''t contain products from current seller):' as info;
SELECT 
    bo.order_number,
    bo.seller_id,
    bo.buyer_id,
    bo.status,
    bo.total_amount,
    bo.created_at,
    'DELETE' as action
FROM buyer_orders bo
WHERE bo.id NOT IN (
    SELECT DISTINCT bo2.id
    FROM buyer_orders bo2
    JOIN buyer_order_items boi ON bo2.id = boi.order_id
    LEFT JOIN products p ON boi.product_id::uuid = p.id
    WHERE p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT bo2.id
    FROM buyer_orders bo2
    JOIN buyer_order_items boi ON bo2.id = boi.order_id
    LEFT JOIN seller_add_item_preloved sap ON boi.product_id::uuid = sap.id
    WHERE sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT bo2.id
    FROM buyer_orders bo2
    JOIN buyer_order_items boi ON bo2.id = boi.order_id
    LEFT JOIN seller_add_barter_item sab ON boi.product_id::uuid = sab.id
    WHERE sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
)
ORDER BY bo.created_at DESC;

-- Step 4: Delete order items first (foreign key constraint)
DELETE FROM buyer_order_items 
WHERE order_id IN (
    SELECT bo.id
    FROM buyer_orders bo
    WHERE bo.id NOT IN (
        SELECT DISTINCT bo2.id
        FROM buyer_orders bo2
        JOIN buyer_order_items boi ON bo2.id = boi.order_id
        LEFT JOIN products p ON boi.product_id::uuid = p.id
        WHERE p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
        
        UNION
        
        SELECT DISTINCT bo2.id
        FROM buyer_orders bo2
        JOIN buyer_order_items boi ON bo2.id = boi.order_id
        LEFT JOIN seller_add_item_preloved sap ON boi.product_id::uuid = sap.id
        WHERE sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
        
        UNION
        
        SELECT DISTINCT bo2.id
        FROM buyer_orders bo2
        JOIN buyer_order_items boi ON bo2.id = boi.order_id
        LEFT JOIN seller_add_barter_item sab ON boi.product_id::uuid = sab.id
        WHERE sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    )
);

-- Step 5: Delete orders that don't belong to current seller
DELETE FROM buyer_orders 
WHERE id NOT IN (
    SELECT DISTINCT bo2.id
    FROM buyer_orders bo2
    JOIN buyer_order_items boi ON bo2.id = boi.order_id
    LEFT JOIN products p ON boi.product_id::uuid = p.id
    WHERE p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT bo2.id
    FROM buyer_orders bo2
    JOIN buyer_order_items boi ON bo2.id = boi.order_id
    LEFT JOIN seller_add_item_preloved sap ON boi.product_id::uuid = sap.id
    WHERE sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT bo2.id
    FROM buyer_orders bo2
    JOIN buyer_order_items boi ON bo2.id = boi.order_id
    LEFT JOIN seller_add_barter_item sab ON boi.product_id::uuid = sab.id
    WHERE sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
);

-- Step 6: Do the same for orders table
DELETE FROM order_items 
WHERE order_id IN (
    SELECT o.id
    FROM orders o
    WHERE o.id NOT IN (
        SELECT DISTINCT o2.id
        FROM orders o2
        JOIN order_items oi ON o2.id = oi.order_id
        LEFT JOIN products p ON oi.product_id::uuid = p.id
        WHERE p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
        
        UNION
        
        SELECT DISTINCT o2.id
        FROM orders o2
        JOIN order_items oi ON o2.id = oi.order_id
        LEFT JOIN seller_add_item_preloved sap ON oi.product_id::uuid = sap.id
        WHERE sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
        
        UNION
        
        SELECT DISTINCT o2.id
        FROM orders o2
        JOIN order_items oi ON o2.id = oi.order_id
        LEFT JOIN seller_add_barter_item sab ON oi.product_id::uuid = sab.id
        WHERE sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    )
);

DELETE FROM orders 
WHERE id NOT IN (
    SELECT DISTINCT o2.id
    FROM orders o2
    JOIN order_items oi ON o2.id = oi.order_id
    LEFT JOIN products p ON oi.product_id::uuid = p.id
    WHERE p.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT o2.id
    FROM orders o2
    JOIN order_items oi ON o2.id = oi.order_id
    LEFT JOIN seller_add_item_preloved sap ON oi.product_id::uuid = sap.id
    WHERE sap.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
    
    UNION
    
    SELECT DISTINCT o2.id
    FROM orders o2
    JOIN order_items oi ON o2.id = oi.order_id
    LEFT JOIN seller_add_barter_item sab ON oi.product_id::uuid = sab.id
    WHERE sab.seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'
);

-- Step 7: Show final results
SELECT 'Remaining orders after cleanup:' as info;
SELECT 
    'buyer_orders' as table_name,
    order_number,
    seller_id,
    buyer_id,
    status,
    total_amount,
    created_at
FROM buyer_orders 
ORDER BY created_at DESC;

SELECT 
    'orders' as table_name,
    order_number,
    seller_id,
    buyer_id,
    status,
    total_amount,
    created_at
FROM orders 
ORDER BY created_at DESC;

SELECT 'Orders cleanup completed! Only orders with products from current seller remain.' as status;
