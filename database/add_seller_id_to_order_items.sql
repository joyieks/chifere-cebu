-- Add seller_id column to buyer_order_items table and populate it
-- This ensures each order item knows which seller it belongs to

-- Step 1: Add seller_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_order_items' 
        AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE public.buyer_order_items 
        ADD COLUMN seller_id TEXT;
        RAISE NOTICE 'Added seller_id column to buyer_order_items';
    ELSE
        RAISE NOTICE 'seller_id column already exists in buyer_order_items';
    END IF;
END $$;

-- Step 2: Update existing order items with seller_id from their parent order
UPDATE buyer_order_items 
SET seller_id = (
    SELECT bo.seller_id 
    FROM buyer_orders bo 
    WHERE bo.id = buyer_order_items.order_id
)
WHERE seller_id IS NULL;

-- Step 3: For any remaining NULL seller_ids, try to get from products table
UPDATE buyer_order_items 
SET seller_id = (
    SELECT p.seller_id 
    FROM products p 
    WHERE p.id = buyer_order_items.product_id
)
WHERE seller_id IS NULL 
AND product_id IS NOT NULL;

-- Step 4: For any still NULL seller_ids, use the known seller ID
UPDATE buyer_order_items 
SET seller_id = '4e515ace-e853-4f63-badf-34fc62cabdee'
WHERE seller_id IS NULL;

-- Step 5: Verify the update
SELECT 
    seller_id,
    COUNT(*) as item_count
FROM buyer_order_items 
GROUP BY seller_id
ORDER BY item_count DESC;

-- Step 6: Check for any remaining NULL seller_ids
SELECT COUNT(*) as null_seller_ids
FROM buyer_order_items 
WHERE seller_id IS NULL;
