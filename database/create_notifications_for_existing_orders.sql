-- Create notifications for existing orders that buyers have already placed
-- This will generate notifications for all existing orders that don't have notifications yet

-- Step 1: Create a function to generate notifications for existing orders
CREATE OR REPLACE FUNCTION create_notifications_for_existing_orders()
RETURNS TABLE(
    order_id UUID,
    order_number VARCHAR,
    buyer_name TEXT,
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
    -- Loop through all existing orders
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
        -- Check if notification already exists for this order
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications 
            WHERE data->>'order_id' = order_record.id::TEXT
            AND type = 'new_order_received'
        ) THEN
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
            
            -- Get product name and count items
            SELECT 
                oi.product_name,
                COUNT(*)
            INTO product_name, total_items
            FROM public.buyer_order_items oi
            WHERE oi.order_id = order_record.id
            GROUP BY oi.product_name
            LIMIT 1;
            
            -- Create notification for existing order
            SELECT create_notification(
                order_record.seller_id,
                'new_order_received',
                'New Order Received! 🎉',
                buyer_name || ' placed a new order for ' || COALESCE(product_name, 'items') || ' (Order #' || order_record.order_number || ')',
                jsonb_build_object(
                    'order_id', order_record.id,
                    'order_number', order_record.order_number,
                    'buyer_id', order_record.buyer_id,
                    'buyer_name', buyer_name,
                    'total_amount', order_record.total_amount,
                    'item_count', total_items,
                    'seller_name', seller_name,
                    'created_for_existing_order', true
                )
            ) INTO notification_id;
            
            -- Return the result
            order_id := order_record.id;
            order_number := order_record.order_number;
            buyer_name := buyer_name;
            seller_name := seller_name;
            product_name := product_name;
            notification_id := notification_id;
            
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Execute the function to create notifications for existing orders
SELECT 
    order_id,
    order_number,
    buyer_name,
    seller_name,
    product_name,
    notification_id
FROM create_notifications_for_existing_orders();

-- Step 3: Show summary of what was created
SELECT 
    'Notifications Created for Existing Orders' as status,
    COUNT(*) as total_notifications_created
FROM public.notifications 
WHERE data->>'created_for_existing_order' = 'true';

-- Step 4: Show all notifications (including the new ones)
SELECT 
    id,
    type,
    title,
    message,
    user_id,
    created_at,
    data->>'order_number' as order_number,
    data->>'buyer_name' as buyer_name
FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 5: Clean up the temporary function
DROP FUNCTION IF EXISTS create_notifications_for_existing_orders();
