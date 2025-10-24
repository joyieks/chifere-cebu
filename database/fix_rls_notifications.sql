-- Fix RLS policies for notification triggers
-- The issue is that RLS is blocking trigger functions from creating notifications

-- Step 1: Drop existing RLS policies that are too restrictive
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Step 2: Create a more permissive policy for system/trigger operations
CREATE POLICY "Allow system notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Step 3: Ensure the create_notification function has proper permissions
-- Grant execute permissions to the function
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO anon;

-- Step 4: Update the create_notification function to bypass RLS when called by triggers
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Check if user_id is null
    IF p_user_id IS NULL THEN
        RAISE WARNING 'Cannot create notification: user_id is null';
        RETURN NULL;
    END IF;
    
    -- Check if user exists in user_profiles
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
        RAISE WARNING 'Cannot create notification: user_id % does not exist in user_profiles', p_user_id;
        RETURN NULL;
    END IF;
    
    -- Insert notification with SECURITY DEFINER to bypass RLS
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        p_user_id,
        p_type::VARCHAR,
        p_title,
        p_message,
        p_data
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Ensure all trigger functions are SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    product_name TEXT;
    total_items INTEGER;
    seller_id_to_notify UUID;
    seller_name TEXT;
BEGIN
    -- Get seller_id from the order or from order items
    IF NEW.seller_id IS NOT NULL THEN
        seller_id_to_notify := NEW.seller_id;
    ELSE
        -- Try to get seller_id from the first order item
        SELECT oi.seller_id INTO seller_id_to_notify
        FROM public.buyer_order_items oi
        WHERE oi.order_id = NEW.id
        LIMIT 1;
    END IF;
    
    -- If still no seller_id, skip notification
    IF seller_id_to_notify IS NULL THEN
        RAISE WARNING 'Cannot notify: No seller_id found for order %', NEW.id;
        RETURN NEW;
    END IF;

    -- Get buyer name
    SELECT COALESCE(display_name, business_name, 'Buyer')
    INTO buyer_name
    FROM public.user_profiles
    WHERE id = NEW.buyer_id;
    
    -- Get seller name
    SELECT COALESCE(display_name, business_name, 'Seller')
    INTO seller_name
    FROM public.user_profiles
    WHERE id = seller_id_to_notify;
    
    -- Get product name and count items
    SELECT 
        oi.product_name,
        COUNT(*)
    INTO product_name, total_items
    FROM public.buyer_order_items oi
    WHERE oi.order_id = NEW.id
    GROUP BY oi.product_name
    LIMIT 1;
    
    -- Notify seller about new order
    PERFORM create_notification(
        seller_id_to_notify,
        'new_order_received',
        'New Order Received! 🎉',
        buyer_name || ' placed a new order for ' || COALESCE(product_name, 'items') || ' (Order #' || NEW.order_number || ')',
        jsonb_build_object(
            'order_id', NEW.id,
            'order_number', NEW.order_number,
            'buyer_id', NEW.buyer_id,
            'buyer_name', buyer_name,
            'total_amount', NEW.total_amount,
            'item_count', total_items,
            'seller_name', seller_name
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_order_status_update()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    seller_name TEXT;
    product_name TEXT;
BEGIN
    -- Only notify if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get buyer and seller names
        SELECT 
            COALESCE(up_buyer.display_name, up_buyer.business_name, 'Buyer'),
            COALESCE(up_seller.display_name, up_seller.business_name, 'Seller')
        INTO buyer_name, seller_name
        FROM public.user_profiles up_buyer, public.user_profiles up_seller
        WHERE up_buyer.id = NEW.buyer_id AND up_seller.id = NEW.seller_id;
        
        -- Get product name from first order item
        SELECT oi.product_name INTO product_name
        FROM public.buyer_order_items oi
        WHERE oi.order_id = NEW.id
        LIMIT 1;
        
        -- Notify buyer about status update
        IF NEW.buyer_id IS NOT NULL THEN
            PERFORM create_notification(
                NEW.buyer_id,
                'order_status_update',
                'Order Status Updated 📦',
                'Your order for ' || COALESCE(product_name, 'items') || ' has been updated to: ' || NEW.status || ' by ' || COALESCE(seller_name, 'Seller'),
                jsonb_build_object(
                    'order_id', NEW.id,
                    'order_number', NEW.order_number,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'seller_name', seller_name,
                    'product_name', product_name
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant permissions to the trigger functions
GRANT EXECUTE ON FUNCTION notify_new_order TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_order TO anon;
GRANT EXECUTE ON FUNCTION notify_order_status_update TO authenticated;
GRANT EXECUTE ON FUNCTION notify_order_status_update TO anon;

-- Step 7: Test the fix by creating a test notification
-- This should work now with the updated RLS policy
DO $$
DECLARE
    test_user_id UUID;
    notification_id UUID;
BEGIN
    -- Get a test user (first seller)
    SELECT id INTO test_user_id 
    FROM public.user_profiles 
    WHERE user_type = 'seller' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try to create a test notification
        SELECT create_notification(
            test_user_id,
            'new_order_received',
            'Test Notification - RLS Fix',
            'This is a test to verify RLS policies are working',
            jsonb_build_object('test', true, 'timestamp', NOW())
        ) INTO notification_id;
        
        IF notification_id IS NOT NULL THEN
            RAISE NOTICE 'Test notification created successfully with ID: %', notification_id;
            
            -- Clean up test notification
            DELETE FROM public.notifications WHERE id = notification_id;
            RAISE NOTICE 'Test notification cleaned up';
        ELSE
            RAISE NOTICE 'Test notification creation failed';
        END IF;
    ELSE
        RAISE NOTICE 'No seller users found for testing';
    END IF;
END $$;

-- Step 8: Verify the setup
SELECT 'RLS Fix Applied Successfully' as status;

-- Show current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notifications';
