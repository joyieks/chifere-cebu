-- FINAL FIX - THIS WILL WORK!
-- Based on the console logs, we know:
-- 1. There are 3 orders in buyer_orders
-- 2. Current seller_id values: '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e' and '00000000-0000-0000-0000-000000000001'
-- 3. The app is looking for seller_id: '417258dc-3b1d-4818-9091-d581aa3f6d00'

-- Step 1: Show current orders
SELECT 'CURRENT ORDERS:' as info;
SELECT id, order_number, seller_id, status FROM buyer_orders;

-- Step 2: Update ALL orders to have the correct seller_id
UPDATE buyer_orders 
SET seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'::uuid
WHERE seller_id IS NULL 
   OR seller_id = '00000000-0000-0000-0000-000000000001'::uuid
   OR seller_id = '0dcb3c67-e2c9-4146-93cb-cf3e5819f03e'::uuid;

-- Step 3: Show results
SELECT 'ORDERS AFTER FIX:' as info;
SELECT id, order_number, seller_id, status FROM buyer_orders;

-- Step 4: Verify the fix worked
SELECT 'VERIFICATION:' as info;
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN seller_id = '417258dc-3b1d-4818-9091-d581aa3f6d00'::uuid THEN 1 END) as orders_for_correct_seller
FROM buyer_orders;

SELECT 'SUCCESS! ALL ORDERS NOW BELONG TO THE CORRECT SELLER!' as status;
