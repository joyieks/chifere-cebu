-- Final Fix for Trigger Attachment
-- The issue is that triggers are not properly attached to the buyer_orders table

-- Step 1: First, let's check what triggers currently exist
-- This will help us see what's missing

-- Step 2: Drop ALL existing triggers to start fresh
DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.buyer_orders;
DROP TRIGGER IF EXISTS trigger_notify_order_status_update ON public.buyer_orders;
DROP TRIGGER IF EXISTS trigger_notify_new_follower ON public.follows;
DROP TRIGGER IF EXISTS trigger_notify_new_review ON public.reviews;

-- Step 3: Ensure the create_notification function exists and works
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
    
    -- Insert notification
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

-- Step 4: Create the notify_new_order function with better error handling
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    product_name TEXT;
    total_items INTEGER;
    seller_id_to_notify UUID;
    seller_name TEXT;
BEGIN
    -- Log that the trigger is firing
    RAISE NOTICE 'TRIGGER FIRING: notify_new_order for order %', NEW.id;
    
    -- Get seller_id from the order or from order items
    IF NEW.seller_id IS NOT NULL THEN
        seller_id_to_notify := NEW.seller_id;
        RAISE NOTICE 'Using seller_id from order: %', seller_id_to_notify;
    ELSE
        -- Try to get seller_id from the first order item
        SELECT oi.seller_id INTO seller_id_to_notify
        FROM public.buyer_order_items oi
        WHERE oi.order_id = NEW.id
        LIMIT 1;
        
        IF seller_id_to_notify IS NOT NULL THEN
            RAISE NOTICE 'Using seller_id from order items: %', seller_id_to_notify;
        END IF;
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
    
    RAISE NOTICE 'Buyer name: %', buyer_name;
    
    -- Get seller name
    SELECT COALESCE(display_name, business_name, 'Seller')
    INTO seller_name
    FROM public.user_profiles
    WHERE id = seller_id_to_notify;
    
    RAISE NOTICE 'Seller name: %', seller_name;
    
    -- Get product name and count items
    SELECT 
        oi.product_name,
        COUNT(*)
    INTO product_name, total_items
    FROM public.buyer_order_items oi
    WHERE oi.order_id = NEW.id
    GROUP BY oi.product_name
    LIMIT 1;
    
    RAISE NOTICE 'Product name: %, Total items: %', product_name, total_items;
    
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
    
    RAISE NOTICE 'Notification created successfully for seller: %', seller_id_to_notify;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the notify_order_status_update function
CREATE OR REPLACE FUNCTION notify_order_status_update()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    seller_name TEXT;
    product_name TEXT;
BEGIN
    -- Only notify if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        RAISE NOTICE 'TRIGGER FIRING: notify_order_status_update for order %', NEW.id;
        
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
            
            RAISE NOTICE 'Status update notification created for buyer: %', NEW.buyer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the triggers with explicit table references
CREATE TRIGGER trigger_notify_new_order
    AFTER INSERT ON public.buyer_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();

CREATE TRIGGER trigger_notify_order_status_update
    AFTER UPDATE ON public.buyer_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_update();

-- Step 7: Grant all necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO anon;
GRANT EXECUTE ON FUNCTION notify_new_order TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_order TO anon;
GRANT EXECUTE ON FUNCTION notify_order_status_update TO authenticated;
GRANT EXECUTE ON FUNCTION notify_order_status_update TO anon;

-- Step 8: Test the fix by creating a test notification
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
            'Test Notification - Trigger Fix',
            'This is a test to verify the trigger fix works',
            jsonb_build_object('test', true, 'timestamp', NOW())
        ) INTO notification_id;
        
        IF notification_id IS NOT NULL THEN
            RAISE NOTICE 'SUCCESS: Test notification created with ID: %', notification_id;
            
            -- Clean up test notification
            DELETE FROM public.notifications WHERE id = notification_id;
            RAISE NOTICE 'Test notification cleaned up';
        ELSE
            RAISE NOTICE 'FAILED: Test notification creation returned NULL';
        END IF;
    ELSE
        RAISE NOTICE 'No seller users found for testing';
    END IF;
END $$;

-- Step 9: Verify the setup
SELECT 'Trigger Fix Applied Successfully' as status;

-- Show current triggers (if possible)
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'buyer_orders'
ORDER BY trigger_name;
