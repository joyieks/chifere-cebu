-- Fix the foreign key constraint issue in the follows table
-- The constraint is looking for users in the wrong table or has the wrong reference

-- Step 1: Check the current foreign key constraint definition
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    ccu.table_schema AS foreign_schema_name
FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'follows'
    AND kcu.column_name = 'buyer_id';

-- Step 2: Check if the problematic user exists in auth.users
SELECT 
    'Checking if user exists in auth.users:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in auth.users'
        ELSE '❌ User missing from auth.users'
    END as status;

-- Step 3: Check if the problematic user exists in user_profiles
SELECT 
    'Checking if user exists in user_profiles:' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9') 
        THEN '✅ User exists in user_profiles'
        ELSE '❌ User missing from user_profiles'
    END as status;

-- Step 4: Show the actual user data
SELECT 
    'User data from auth.users:' as source,
    id,
    email,
    created_at
FROM auth.users 
WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

SELECT 
    'User data from user_profiles:' as source,
    id,
    email,
    display_name,
    user_type,
    created_at
FROM public.user_profiles 
WHERE id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9';

-- Step 5: Drop the problematic foreign key constraint
-- This will allow us to insert follows without the constraint check
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_buyer_id_fkey;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_seller_id_fkey;

-- Step 6: Recreate the foreign key constraints to point to the correct table
-- Point buyer_id to user_profiles instead of auth.users
ALTER TABLE public.follows 
ADD CONSTRAINT follows_buyer_id_fkey 
FOREIGN KEY (buyer_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Point seller_id to user_profiles instead of auth.users
ALTER TABLE public.follows 
ADD CONSTRAINT follows_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Step 7: Verify the new constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    ccu.table_schema AS foreign_schema_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'follows'
ORDER BY kcu.column_name;

-- Step 8: Test the follow functionality (uncomment to test)
/*
-- Test follow with the problematic user
-- Replace 'REPLACE_WITH_REAL_SELLER_ID' with an actual seller ID

-- Test 1: Insert a follow
INSERT INTO public.follows (buyer_id, seller_id) 
VALUES ('d7f43ccd-3576-43e3-ac94-ec60c7674df9', 'REPLACE_WITH_REAL_SELLER_ID');

-- Test 2: Check if seller_stats was updated
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Test 3: Delete the test follow
DELETE FROM public.follows 
WHERE buyer_id = 'd7f43ccd-3576-43e3-ac94-ec60c7674df9' 
AND seller_id = 'REPLACE_WITH_REAL_SELLER_ID';

-- Test 4: Check if seller_stats was updated again
SELECT * FROM public.seller_stats WHERE seller_id = 'REPLACE_WITH_REAL_SELLER_ID';
*/

-- Step 9: Final verification
SELECT 
    'Foreign key constraint fix completed' as status,
    'Follow functionality should now work' as result;