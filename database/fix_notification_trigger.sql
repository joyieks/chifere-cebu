-- Fix notification trigger to handle null seller_id
-- This prevents the "null value in column user_id" error

-- Step 1: Update the notify_new_order function to check for null seller_id
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    product_name TEXT;
    total_items INTEGER;
    seller_id_to_notify UUID;
BEGIN
    -- Only proceed if seller_id is not null
    IF NEW.seller_id IS NULL THEN
        -- Try to get seller_id from the first order item
        SELECT oi.seller_id INTO seller_id_to_notify
        FROM public.buyer_order_items oi
        WHERE oi.order_id = NEW.id
        LIMIT 1;
        
        -- If still null, skip notification
        IF seller_id_to_notify IS NULL THEN
            RETURN NEW;
        END IF;
    ELSE
        seller_id_to_notify := NEW.seller_id;
    END IF;

    -- Get buyer name
    SELECT COALESCE(display_name, business_name, 'Buyer')
    INTO buyer_name
    FROM public.user_profiles
    WHERE id = NEW.buyer_id;
    
    -- Get product name and count items
    SELECT 
        oi.product_name,
        COUNT(*)
    INTO product_name, total_items
    FROM public.buyer_order_items oi
    WHERE oi.order_id = NEW.id
    GROUP BY oi.product_name
    LIMIT 1;
    
    -- Notify seller about new order (only if we have a valid seller_id)
    IF seller_id_to_notify IS NOT NULL THEN
        PERFORM create_notification(
            seller_id_to_notify,
            'new_order_received',
            'New Order Received!',
            buyer_name || ' placed a new order for ' || COALESCE(product_name, 'items') || ' (Order #' || NEW.order_number || ')',
            jsonb_build_object(
                'order_id', NEW.id,
                'order_number', NEW.order_number,
                'buyer_id', NEW.buyer_id,
                'buyer_name', buyer_name,
                'total_amount', NEW.total_amount,
                'item_count', total_items
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update the notify_order_status_update function to handle null seller_id
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update the create_notification function to add additional safety checks
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
