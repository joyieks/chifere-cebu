-- Fix notification targeting - send notifications only to the specific seller who owns the items
-- Clean up any incorrect notifications and create proper ones

-- Step 1: Clean up all existing notifications that were created incorrectly
DELETE FROM public.notifications 
WHERE data->>'created_for_existing_order' = 'true' 
OR data->>'notification_type' = 'existing_orders_summary';

-- Step 2: Create a function to create notifications for each specific order to the correct seller
CREATE OR REPLACE FUNCTION create_notifications_for_specific_orders()
RETURNS TABLE(
    order_id UUID,
    order_number VARCHAR,
    buyer_name TEXT,
    seller_id UUID,
    seller_name TEXT,
    product_name TEXT,
    notification_id UUID
) AS $$
DECLARE
    order_record RECORD;
    buyer_name TEXT;
    seller_name TEXT;
    product_name TEXT;
    total_items INTEGER;
    notification_id UUID;
BEGIN
    -- Loop through each specific order
    FOR order_record IN 
        SELECT 
            bo.id,
            bo.order_number,
            bo.buyer_id,
            bo.seller_id,
            bo.total_amount,
            bo.created_at
        FROM public.buyer_orders bo
        WHERE bo.seller_id IS NOT NULL
        ORDER BY bo.created_at DESC
    LOOP
        -- Get buyer name
        SELECT COALESCE(display_name, business_name, 'Buyer')
        INTO buyer_name
        FROM public.user_profiles
        WHERE id = order_record.buyer_id;
        
        -- Get seller name
        SELECT COALESCE(display_name, business_name, 'Seller')
        INTO seller_name
        FROM public.user_profiles
        WHERE id = order_record.seller_id;
        
        -- Get product name and count items for this specific order
        SELECT 
            oi.product_name,
            COUNT(*)
        INTO product_name, total_items
        FROM public.buyer_order_items oi
        WHERE oi.order_id = order_record.id
        GROUP BY oi.product_name
        LIMIT 1;
        
        -- Create notification for this specific order to the specific seller
        SELECT create_notification(
            order_record.seller_id,  -- Send to the specific seller who owns the items
            'new_order_received',
            'New Order Received! 🎉',
            buyer_name || ' placed a new order for ' || COALESCE(product_name, 'items') || ' (Order #' || order_record.order_number || ')',
            jsonb_build_object(
                'order_id', order_record.id,
                'order_number', order_record.order_number,
                'buyer_id', order_record.buyer_id,
                'buyer_name', buyer_name,
                'seller_id', order_record.seller_id,
                'seller_name', seller_name,
                'total_amount', order_record.total_amount,
                'item_count', total_items,
                'product_name', product_name,
                'created_for_existing_order', true,
                'notification_type', 'specific_order_notification'
            )
        ) INTO notification_id;
        
        -- Return the result
        order_id := order_record.id;
        order_number := order_record.order_number;
        buyer_name := buyer_name;
        seller_id := order_record.seller_id;
        seller_name := seller_name;
        product_name := product_name;
        notification_id := notification_id;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Execute the function to create notifications for each specific order
SELECT 
    order_id,
    order_number,
    buyer_name,
    seller_id,
    seller_name,
    product_name,
    notification_id
FROM create_notifications_for_specific_orders();

-- Step 4: Show summary of what was created
SELECT 
    'Notifications Created for Specific Orders' as status,
    COUNT(*) as total_notifications_created
FROM public.notifications 
WHERE data->>'notification_type' = 'specific_order_notification';

-- Step 5: Show notifications grouped by seller to verify targeting
SELECT 
    data->>'seller_id' as seller_id,
    data->>'seller_name' as seller_name,
    COUNT(*) as notification_count,
    STRING_AGG(data->>'order_number', ', ') as order_numbers
FROM public.notifications 
WHERE data->>'notification_type' = 'specific_order_notification'
GROUP BY data->>'seller_id', data->>'seller_name'
ORDER BY notification_count DESC;

-- Step 6: Show all notifications (including the new ones)
SELECT 
    id,
    type,
    title,
    message,
    user_id,
    created_at,
    data->>'order_number' as order_number,
    data->>'buyer_name' as buyer_name,
    data->>'seller_name' as seller_name,
    data->>'product_name' as product_name
FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 7: Clean up the temporary function
DROP FUNCTION IF EXISTS create_notifications_for_specific_orders();
