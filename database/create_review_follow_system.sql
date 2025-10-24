-- Create database tables for review and follow system

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    order_id UUID NOT NULL REFERENCES public.buyer_orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false, -- True if buyer actually received the item
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create follows table (buyers following sellers)
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(buyer_id, seller_id) -- Prevent duplicate follows
);

-- 3. Create seller_stats table to store aggregated data
CREATE TABLE IF NOT EXISTS public.seller_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_followers INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_rating_sum INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(seller_id)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON public.reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON public.reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_follows_buyer_id ON public.follows(buyer_id);
CREATE INDEX IF NOT EXISTS idx_follows_seller_id ON public.follows(seller_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at);

CREATE INDEX IF NOT EXISTS idx_seller_stats_seller_id ON public.seller_stats(seller_id);

-- 5. Create RLS policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Buyers can read all reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (true);

-- Buyers can insert their own reviews
CREATE POLICY "Buyers can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own reviews
CREATE POLICY "Buyers can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = buyer_id);

-- Buyers can delete their own reviews
CREATE POLICY "Buyers can delete their own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = buyer_id);

-- 6. Create RLS policies for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Everyone can read follows (for public follower counts)
CREATE POLICY "Follows are viewable by everyone" ON public.follows
    FOR SELECT USING (true);

-- Buyers can follow sellers
CREATE POLICY "Buyers can follow sellers" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Buyers can unfollow sellers
CREATE POLICY "Buyers can unfollow sellers" ON public.follows
    FOR DELETE USING (auth.uid() = buyer_id);

-- 7. Create RLS policies for seller_stats
ALTER TABLE public.seller_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can read seller stats
CREATE POLICY "Seller stats are viewable by everyone" ON public.seller_stats
    FOR SELECT USING (true);

-- Sellers can update their own stats (for manual updates if needed)
CREATE POLICY "Sellers can update their own stats" ON public.seller_stats
    FOR UPDATE USING (auth.uid() = seller_id);

-- 8. Create functions to update seller stats automatically
CREATE OR REPLACE FUNCTION update_seller_follower_count()
RETURNS TRIGGER AS $$
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

CREATE OR REPLACE FUNCTION update_seller_review_stats()
RETURNS TRIGGER AS $$
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

-- 9. Create triggers
CREATE TRIGGER trigger_update_follower_count
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION update_seller_follower_count();

CREATE TRIGGER trigger_update_review_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_seller_review_stats();

-- 10. Insert initial seller stats for existing sellers (only for real users)
INSERT INTO public.seller_stats (seller_id, total_followers, total_reviews, average_rating, total_rating_sum)
SELECT DISTINCT bo.seller_id, 0, 0, 0.00, 0
FROM public.buyer_orders bo
INNER JOIN auth.users u ON bo.seller_id = u.id
WHERE bo.seller_id IS NOT NULL
ON CONFLICT (seller_id) DO NOTHING;
