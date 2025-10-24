-- Check the actual structure of user_profiles table
-- This will help us understand what columns exist

-- Step 1: Get the exact column structure of user_profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Step 2: Show sample data from user_profiles to understand the structure
SELECT 
    'Sample user_profiles data:' as info,
    *
FROM public.user_profiles
LIMIT 3;

-- Step 3: Check what columns exist in auth.users for reference
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;
