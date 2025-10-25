-- FIX DUPLICATE NOTIFICATIONS
-- This script will fix the duplicate notification issue

-- Step 1: Clean up existing duplicate notifications
WITH duplicate_notifications AS (
    SELECT 
        id,
        user_id,
        type,
        data->>'order_id' as order_id,
        data->>'new_status' as new_status,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, type, data->>'order_id', data->>'new_status' 
            ORDER BY created_at DESC
        ) as rn
    FROM public.notifications 
    WHERE type = 'order_status_update'
)
DELETE FROM public.notifications 
WHERE id IN (
    SELECT id 
    FROM duplicate_notifications 
    WHERE rn > 1
);

-- Step 2: Show cleanup results
SELECT 
    'Duplicate notifications cleaned up' as status,
    COUNT(*) as remaining_notifications
FROM public.notifications 
WHERE type = 'order_status_update';

-- Step 3: Add duplicate prevention to the database trigger
CREATE OR REPLACE FUNCTION notify_order_status_update()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    seller_name TEXT;
    product_name TEXT;
    existing_notification_id UUID;
BEGIN
    -- Only notify if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Check for existing notification in the last 5 minutes to prevent duplicates
        SELECT id INTO existing_notification_id
        FROM public.notifications
        WHERE user_id = NEW.buyer_id
        AND type = 'order_status_update'
        AND data->>'order_id' = NEW.id::text
        AND data->>'new_status' = NEW.status
        AND created_at > NOW() - INTERVAL '5 minutes'
        LIMIT 1;
        
        -- Only create notification if no duplicate exists
        IF existing_notification_id IS NULL THEN
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
            
            -- Notify buyer about status update (only if buyer_id is not null)
            IF NEW.buyer_id IS NOT NULL THEN
                PERFORM create_notification(
                    NEW.buyer_id,
                    'order_status_update',
                    'Order Status Updated',
                    'Your order for ' || COALESCE(product_name, 'items') || ' has been updated to: ' || NEW.status,
                    jsonb_build_object(
                        'order_id', NEW.id,
                        'order_number', NEW.order_number,
                        'old_status', OLD.status,
                        'new_status', NEW.status,
                        'seller_name', seller_name
                    )
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the order update
        RAISE WARNING 'Failed to create notification for order %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger
DROP TRIGGER IF EXISTS trigger_notify_order_status ON public.buyer_orders;
CREATE TRIGGER trigger_notify_order_status
    AFTER UPDATE ON public.buyer_orders
    FOR EACH ROW EXECUTE FUNCTION notify_order_status_update();

-- Step 5: Add duplicate prevention to create_notification function
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
    safe_message TEXT;
    existing_notification_id UUID;
BEGIN
    -- Ensure message is not null
    safe_message := COALESCE(p_message, p_title, 'Notification');
    
    -- Ensure title is not null
    IF p_title IS NULL THEN
        p_title := 'Notification';
    END IF;
    
    -- Check for duplicate notifications in the last 5 minutes
    IF p_data IS NOT NULL AND p_data->>'order_id' IS NOT NULL THEN
        SELECT id INTO existing_notification_id
        FROM public.notifications
        WHERE user_id = p_user_id
        AND type = p_type::VARCHAR
        AND data->>'order_id' = p_data->>'order_id'
        AND data->>'new_status' = p_data->>'new_status'
        AND created_at > NOW() - INTERVAL '5 minutes'
        LIMIT 1;
        
        IF existing_notification_id IS NOT NULL THEN
            -- Return existing notification ID instead of creating duplicate
            RETURN existing_notification_id;
        END IF;
    END IF;
    
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
        safe_message,
        p_data
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        RAISE WARNING 'Failed to create notification: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'DUPLICATE NOTIFICATIONS FIXED!' as status;
