-- Fix notification looping issue
-- Create only one notification per seller for their existing orders

-- Step 1: First, let's clean up any duplicate notifications that might have been created
DELETE FROM public.notifications 
WHERE data->>'created_for_existing_order' = 'true';

-- Step 2: Create a function to create ONE notification per seller for their existing orders
CREATE OR REPLACE FUNCTION create_single_notification_per_seller()
RETURNS TABLE(
    seller_id UUID,
    seller_name TEXT,
    total_orders INTEGER,
    notification_id UUID
) AS $$
DECLARE
    seller_record RECORD;
    seller_name TEXT;
    total_orders INTEGER;
    notification_id UUID;
    order_summary TEXT;
BEGIN
    -- Loop through each seller who has orders
    FOR seller_record IN 
        SELECT 
            bo.seller_id,
            COUNT(*) as order_count
        FROM public.buyer_orders bo
        WHERE bo.seller_id IS NOT NULL
        GROUP BY bo.seller_id
        ORDER BY order_count DESC
    LOOP
        -- Get seller name
        SELECT COALESCE(display_name, business_name, 'Seller')
        INTO seller_name
        FROM public.user_profiles
        WHERE id = seller_record.seller_id;
        
        -- Count total orders for this seller
        SELECT COUNT(*)
        INTO total_orders
        FROM public.buyer_orders
        WHERE buyer_orders.seller_id = seller_record.seller_id;
        
        -- Create order summary
        order_summary := 'You have ' || total_orders || ' existing order(s) that were placed before notifications were set up.';
        
        -- Create ONE notification per seller
        SELECT create_notification(
            seller_record.seller_id,
            'new_order_received',
            'Existing Orders Summary 📦',
            order_summary || ' Check your orders to see the details.',
            jsonb_build_object(
                'seller_id', seller_record.seller_id,
                'seller_name', seller_name,
                'total_existing_orders', total_orders,
                'created_for_existing_orders', true,
                'notification_type', 'existing_orders_summary'
            )
        ) INTO notification_id;
        
        -- Return the result
        seller_id := seller_record.seller_id;
        seller_name := seller_name;
        total_orders := total_orders;
        notification_id := notification_id;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Execute the function to create one notification per seller
SELECT 
    seller_id,
    seller_name,
    total_orders,
    notification_id
FROM create_single_notification_per_seller();

-- Step 4: Show summary of what was created
SELECT 
    'Single Notifications Created per Seller' as status,
    COUNT(*) as total_sellers_notified
FROM public.notifications 
WHERE data->>'notification_type' = 'existing_orders_summary';

-- Step 5: Show all notifications (including the new ones)
SELECT 
    id,
    type,
    title,
    message,
    user_id,
    created_at,
    data->>'total_existing_orders' as total_orders,
    data->>'seller_name' as seller_name
FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 6: Clean up the temporary function
DROP FUNCTION IF EXISTS create_single_notification_per_seller();
