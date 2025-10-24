-- Update trigger functions to work properly with RLS
-- This ensures the triggers can update seller_stats even with RLS enabled

-- Step 1: Update the follower count function to use SECURITY DEFINER
-- This allows the function to run with the privileges of the function owner
CREATE OR REPLACE FUNCTION update_seller_follower_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.seller_stats (seller_id, total_followers)
        VALUES (NEW.seller_id, 1)
        ON CONFLICT (seller_id) 
        DO UPDATE SET 
            total_followers = seller_stats.total_followers + 1,
            updated_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.seller_stats 
        SET 
            total_followers = GREATEST(total_followers - 1, 0),
            updated_at = NOW()
        WHERE seller_id = OLD.seller_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update the review stats function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_seller_review_stats()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.seller_stats (seller_id, total_reviews, total_rating_sum, average_rating)
        VALUES (NEW.seller_id, 1, NEW.rating, NEW.rating)
        ON CONFLICT (seller_id) 
        DO UPDATE SET 
            total_reviews = seller_stats.total_reviews + 1,
            total_rating_sum = seller_stats.total_rating_sum + NEW.rating,
            average_rating = ROUND((seller_stats.total_rating_sum + NEW.rating)::DECIMAL / (seller_stats.total_reviews + 1), 2),
            updated_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.seller_stats 
        SET 
            total_rating_sum = total_rating_sum - OLD.rating + NEW.rating,
            average_rating = ROUND(total_rating_sum::DECIMAL / total_reviews, 2),
            updated_at = NOW()
        WHERE seller_id = NEW.seller_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.seller_stats 
        SET 
            total_reviews = GREATEST(total_reviews - 1, 0),
            total_rating_sum = GREATEST(total_rating_sum - OLD.rating, 0),
            average_rating = CASE 
                WHEN total_reviews - 1 = 0 THEN 0.00
                ELSE ROUND((total_rating_sum - OLD.rating)::DECIMAL / (total_reviews - 1), 2)
            END,
            updated_at = NOW()
        WHERE seller_id = OLD.seller_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Verify the functions were updated
SELECT 
    routine_name,
    routine_type,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_seller_follower_count', 'update_seller_review_stats');
