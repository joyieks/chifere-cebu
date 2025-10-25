-- FIX NOTIFICATION TRIGGER
-- This will fix the database trigger that's causing the notification error

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.buyer_orders;

-- Step 2: Fix the notify_new_order function to handle null values
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    product_name TEXT;
    total_items INTEGER;
    notification_message TEXT;
BEGIN
    -- Get buyer name with fallback
    SELECT COALESCE(display_name, business_name, 'Buyer')
    INTO buyer_name
    FROM public.user_profiles
    WHERE id = NEW.buyer_id;
    
    -- Ensure buyer_name is not null
    IF buyer_name IS NULL THEN
        buyer_name := 'Buyer';
    END IF;
    
    -- Get product name and count items with fallback
    SELECT 
        COALESCE(oi.product_name, 'items'),
        COUNT(*)
    INTO product_name, total_items
    FROM public.buyer_order_items oi
    WHERE oi.order_id = NEW.id
    GROUP BY oi.product_name
    LIMIT 1;
    
    -- Ensure product_name is not null
    IF product_name IS NULL THEN
        product_name := 'items';
    END IF;
    
    -- Ensure total_items is not null
    IF total_items IS NULL THEN
        total_items := 1;
    END IF;
    
    -- Build notification message with proper null handling
    notification_message := buyer_name || ' placed a new order for ' || product_name || ' (Order #' || COALESCE(NEW.order_number, 'Unknown') || ')';
    
    -- Ensure message is not null or empty
    IF notification_message IS NULL OR notification_message = '' THEN
        notification_message := 'New order received (Order #' || COALESCE(NEW.order_number, 'Unknown') || ')';
    END IF;
    
    -- Notify seller about new order
    PERFORM create_notification(
        NEW.seller_id,
        'new_order_received',
        'New Order Received!',
        notification_message,
        jsonb_build_object(
            'order_id', NEW.id,
            'order_number', COALESCE(NEW.order_number, 'Unknown'),
            'buyer_id', NEW.buyer_id,
            'buyer_name', buyer_name,
            'total_amount', COALESCE(NEW.total_amount, 0),
            'item_count', total_items
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the order creation
        RAISE WARNING 'Failed to create notification for order %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
CREATE TRIGGER trigger_notify_new_order
    AFTER INSERT ON public.buyer_orders
    FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- Step 4: Also fix the create_notification function to handle null messages
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
BEGIN
    -- Ensure message is not null
    safe_message := COALESCE(p_message, p_title, 'Notification');
    
    -- Ensure title is not null
    IF p_title IS NULL THEN
        p_title := 'Notification';
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

SELECT 'NOTIFICATION TRIGGER FIXED!' as status;
