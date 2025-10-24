-- Fix script for review system issues
-- Run this if reviews are not being saved or displayed

-- 1. Drop and recreate RLS policies to ensure they're correct
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Buyers can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Buyers can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Buyers can delete their own reviews" ON public.reviews;

-- Recreate RLS policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can delete their own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = buyer_id);

-- 2. Ensure the review trigger function exists and is working
CREATE OR REPLACE FUNCTION update_seller_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update seller stats when a new review is added
        INSERT INTO public.seller_stats (seller_id, total_reviews, total_rating_sum, average_rating)
        VALUES (NEW.seller_id, 1, NEW.rating, NEW.rating)
        ON CONFLICT (seller_id) 
        DO UPDATE SET 
            total_reviews = seller_stats.total_reviews + 1,
            total_rating_sum = seller_stats.total_rating_sum + NEW.rating,
            average_rating = ROUND((seller_stats.total_rating_sum + NEW.rating)::DECIMAL / (seller_stats.total_reviews + 1), 2),
            updated_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update seller stats when a review is deleted
        UPDATE public.seller_stats 
        SET 
            total_reviews = GREATEST(total_reviews - 1, 0),
            total_rating_sum = GREATEST(total_rating_sum - OLD.rating, 0),
            average_rating = CASE 
                WHEN (total_reviews - 1) > 0 THEN 
                    ROUND((total_rating_sum - OLD.rating)::DECIMAL / (total_reviews - 1), 2)
                ELSE 0.00
            END,
            updated_at = NOW()
        WHERE seller_id = OLD.seller_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update seller stats when a review is updated
        UPDATE public.seller_stats 
        SET 
            total_rating_sum = total_rating_sum - OLD.rating + NEW.rating,
            average_rating = ROUND(total_rating_sum::DECIMAL / total_reviews, 2),
            updated_at = NOW()
        WHERE seller_id = NEW.seller_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_update_review_stats ON public.reviews;
CREATE TRIGGER trigger_update_review_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_seller_review_stats();

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.seller_stats TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Create a test review to verify the system works
-- (This will only work if you have valid user IDs)
-- Uncomment and modify the following lines to test:
/*
INSERT INTO public.reviews (
    buyer_id,
    seller_id,
    product_id,
    order_id,
    rating,
    comment,
    is_verified
) VALUES (
    'your-buyer-id-here',
    'your-seller-id-here',
    'your-product-id-here',
    'your-order-id-here',
    5,
    'Test review to verify system is working',
    true
);
*/

-- 6. Check if the test review was created and stats were updated
SELECT 'Review System Status' as status;
SELECT 
    (SELECT COUNT(*) FROM public.reviews) as total_reviews,
    (SELECT COUNT(*) FROM public.seller_stats) as seller_stats_count;
