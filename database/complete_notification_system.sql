-- Complete Notification System for ChiFere
-- This creates all necessary triggers for:
-- 1. Buyer orders → Seller receives notification
-- 2. Seller updates order status → Buyer receives notification  
-- 3. Someone follows store → Seller receives notification

-- Step 1: Ensure notifications table exists with proper structure
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Step 3: Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Step 5: Create notification types enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'order_status_update',
        'new_order_received', 
        'new_follower',
        'new_review',
        'order_cancelled',
        'payment_received',
        'item_sold'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 6: Create enhanced create_notification function with safety checks
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

-- Step 7: Create trigger for NEW ORDERS (Buyer orders → Seller gets notified)
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

-- Step 8: Create trigger for ORDER STATUS UPDATES (Seller updates → Buyer gets notified)
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

-- Step 9: Create trigger for NEW FOLLOWERS (Someone follows store → Seller gets notified)
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
    follower_name TEXT;
    seller_name TEXT;
BEGIN
    -- Get follower and seller names
    SELECT 
        COALESCE(up_follower.display_name, up_follower.business_name, 'Someone'),
        COALESCE(up_seller.display_name, up_seller.business_name, 'Seller')
    INTO follower_name, seller_name
    FROM public.user_profiles up_follower, public.user_profiles up_seller
    WHERE up_follower.id = NEW.follower_id AND up_seller.id = NEW.seller_id;
    
    -- Notify seller about new follower
    PERFORM create_notification(
        NEW.seller_id,
        'new_follower',
        'New Follower! 👥',
        follower_name || ' started following your store',
        jsonb_build_object(
            'follower_id', NEW.follower_id,
            'follower_name', follower_name,
            'seller_id', NEW.seller_id,
            'seller_name', seller_name,
            'followed_at', NEW.created_at
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger for NEW REVIEWS (Buyer reviews → Seller gets notified)
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
    reviewer_name TEXT;
    seller_name TEXT;
    product_name TEXT;
BEGIN
    -- Get reviewer and seller names
    SELECT 
        COALESCE(up_reviewer.display_name, up_reviewer.business_name, 'Customer'),
        COALESCE(up_seller.display_name, up_seller.business_name, 'Seller')
    INTO reviewer_name, seller_name
    FROM public.user_profiles up_reviewer, public.user_profiles up_seller
    WHERE up_reviewer.id = NEW.buyer_id AND up_seller.id = NEW.seller_id;
    
    -- Get product name
    SELECT name INTO product_name
    FROM public.products
    WHERE id = NEW.product_id;
    
    -- Notify seller about new review
    PERFORM create_notification(
        NEW.seller_id,
        'new_review',
        'New Review! ⭐',
        reviewer_name || ' left a ' || NEW.rating || '-star review for ' || COALESCE(product_name, 'your product'),
        jsonb_build_object(
            'review_id', NEW.id,
            'reviewer_id', NEW.buyer_id,
            'reviewer_name', reviewer_name,
            'seller_id', NEW.seller_id,
            'seller_name', seller_name,
            'product_id', NEW.product_id,
            'product_name', product_name,
            'rating', NEW.rating,
            'comment', NEW.comment
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create the actual triggers
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.buyer_orders;
DROP TRIGGER IF EXISTS trigger_notify_order_status_update ON public.buyer_orders;
DROP TRIGGER IF EXISTS trigger_notify_new_follower ON public.follows;
DROP TRIGGER IF EXISTS trigger_notify_new_review ON public.reviews;

-- Create triggers
CREATE TRIGGER trigger_notify_new_order
    AFTER INSERT ON public.buyer_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();

CREATE TRIGGER trigger_notify_order_status_update
    AFTER UPDATE ON public.buyer_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_update();

CREATE TRIGGER trigger_notify_new_follower
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_follower();

CREATE TRIGGER trigger_notify_new_review
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_review();

-- Step 12: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

-- Step 13: Create helper functions for the frontend
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, updated_at = NOW()
    WHERE id = notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications 
    SET is_read = true, updated_at = NOW()
    WHERE user_id = auth.uid() AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM public.notifications
    WHERE user_id = auth.uid() AND is_read = false;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for helper functions
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- Step 14: Verify the setup
SELECT 'Complete Notification System Setup Complete' as status;

-- Show created triggers
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'trigger_notify_%'
ORDER BY trigger_name;

-- Show created functions
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%'
ORDER BY routine_name;
