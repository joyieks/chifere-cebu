-- Fix RLS policies for the follow and review system
-- This script addresses the "new row violates row-level security policy" errors

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Sellers can update their own stats" ON public.seller_stats;
DROP POLICY IF EXISTS "Buyers can follow sellers" ON public.follows;
DROP POLICY IF EXISTS "Buyers can unfollow sellers" ON public.follows;
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;

-- Step 2: Create new, more permissive policies for seller_stats
-- Allow system to insert/update seller stats (for triggers)
CREATE POLICY "Allow system to manage seller stats" ON public.seller_stats
    FOR ALL USING (true) WITH CHECK (true);

-- Step 3: Create new policies for follows table
-- Allow buyers to follow sellers
CREATE POLICY "Buyers can follow sellers" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Allow buyers to unfollow sellers  
CREATE POLICY "Buyers can unfollow sellers" ON public.follows
    FOR DELETE USING (auth.uid() = buyer_id);

-- Allow everyone to read follows (for checking follow status)
CREATE POLICY "Follows are viewable by everyone" ON public.follows
    FOR SELECT USING (true);

-- Step 4: Verify the policies are working
-- Test by checking current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('follows', 'seller_stats', 'reviews')
ORDER BY tablename, policyname;

-- Step 5: Test the system (optional - uncomment to test with real user IDs)
/*
-- Example test (replace with real user IDs):
-- This will test if the follow system now works

-- Test 1: Check if we can insert a follow
INSERT INTO public.follows (buyer_id, seller_id) 
VALUES ('REPLACE_WITH_REAL_BUYER_ID', 'REPLACE_WITH_REAL_SELLER_ID');

-- Test 2: Check if seller_stats was updated
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Test 3: Remove the test follow
DELETE FROM public.follows 
WHERE buyer_id = 'REPLACE_WITH_REAL_BUYER_ID' 
AND seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Test 4: Check if seller_stats was updated again
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';
*/