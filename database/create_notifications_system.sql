-- Real-time Notifications System for ChiFere
-- This creates a comprehensive notification system for buyers and sellers

-- Step 1: Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'order_status', 'new_order', 'new_follower', 'new_review'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data like order_id, product_id, etc.
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
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Step 5: Create notification types enum (for better data integrity)
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

-- Step 6: Create function to create notifications
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

-- Step 7: Create trigger for order status updates
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order status updates
DROP TRIGGER IF EXISTS trigger_notify_order_status ON public.buyer_orders;
CREATE TRIGGER trigger_notify_order_status
    AFTER UPDATE ON public.buyer_orders
    FOR EACH ROW EXECUTE FUNCTION notify_order_status_update();

-- Step 8: Create trigger for new orders (notify seller)
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    product_name TEXT;
    total_items INTEGER;
BEGIN
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
    
    -- Notify seller about new order
    PERFORM create_notification(
        NEW.seller_id,
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.buyer_orders;
CREATE TRIGGER trigger_notify_new_order
    AFTER INSERT ON public.buyer_orders
    FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- Step 9: Create trigger for new followers (notify seller)
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
    follower_name TEXT;
BEGIN
    -- Get follower name
    SELECT COALESCE(display_name, business_name, 'Someone')
    INTO follower_name
    FROM public.user_profiles
    WHERE id = NEW.buyer_id;
    
    -- Notify seller about new follower
    PERFORM create_notification(
        NEW.seller_id,
        'new_follower',
        'New Follower!',
        follower_name || ' started following your store',
        jsonb_build_object(
            'follower_id', NEW.buyer_id,
            'follower_name', follower_name,
            'follow_id', NEW.id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new followers
DROP TRIGGER IF EXISTS trigger_notify_new_follower ON public.follows;
CREATE TRIGGER trigger_notify_new_follower
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

-- Step 10: Create trigger for new reviews (notify seller)
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
    reviewer_name TEXT;
    product_name TEXT;
BEGIN
    -- Get reviewer name
    SELECT COALESCE(display_name, business_name, 'Someone')
    INTO reviewer_name
    FROM public.user_profiles
    WHERE id = NEW.buyer_id;
    
    -- Get product name
    SELECT name INTO product_name
    FROM public.products
    WHERE id = NEW.product_id;
    
    -- Notify seller about new review
    PERFORM create_notification(
        NEW.seller_id,
        'new_review',
        'New Review Received!',
        reviewer_name || ' left a ' || NEW.rating || '-star review for "' || COALESCE(product_name, 'your product') || '"',
        jsonb_build_object(
            'review_id', NEW.id,
            'product_id', NEW.product_id,
            'product_name', product_name,
            'reviewer_id', NEW.buyer_id,
            'reviewer_name', reviewer_name,
            'rating', NEW.rating,
            'comment', NEW.comment
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new reviews
DROP TRIGGER IF EXISTS trigger_notify_new_review ON public.reviews;
CREATE TRIGGER trigger_notify_new_review
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION notify_new_review();

-- Step 11: Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, updated_at = NOW()
    WHERE id = notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create function to mark all notifications as read
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

-- Step 13: Create function to get unread notification count
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

-- Step 14: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- Step 15: Create a test notification (optional - remove in production)
-- INSERT INTO public.notifications (user_id, type, title, message, data)
-- SELECT 
--     id,
--     'order_status_update',
--     'Welcome to ChiFere!',
--     'Your notification system is now active. You will receive real-time updates about your orders, followers, and reviews.',
--     '{"welcome": true}'::jsonb
-- FROM auth.users
-- LIMIT 1;

-- Step 16: Verify the setup
SELECT 'Notifications System Setup Complete' as status;
SELECT 
    'Tables created' as component,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_name = 'notifications' AND table_schema = 'public'
UNION ALL
SELECT 
    'Triggers created' as component,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE event_object_table IN ('buyer_orders', 'follows', 'reviews')
UNION ALL
SELECT 
    'Functions created' as component,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN ('create_notification', 'notify_order_status_update', 'notify_new_order', 'notify_new_follower', 'notify_new_review');
