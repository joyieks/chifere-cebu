-- ============================================
-- Quick Cart Database Test
-- ============================================
-- Run this after SETUP_CART_DATABASE.sql
-- to verify everything is working correctly
-- ============================================

-- Test 1: Check if table exists
-- ============================================
SELECT 
    'Test 1: Table Exists' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'buyer_add_to_cart'
        ) THEN '✅ PASS: Table exists'
        ELSE '❌ FAIL: Table does not exist'
    END as result;

-- Test 2: Check RLS is enabled
-- ============================================
SELECT 
    'Test 2: RLS Enabled' as test,
    CASE 
        WHEN rowsecurity = true THEN '✅ PASS: RLS is enabled'
        ELSE '❌ FAIL: RLS is not enabled'
    END as result
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'buyer_add_to_cart';

-- Test 3: Check if all 4 policies exist
-- ============================================
SELECT 
    'Test 3: RLS Policies' as test,
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ PASS: All 4 policies exist'
        WHEN COUNT(*) > 0 THEN '⚠️ WARNING: Only ' || COUNT(*) || ' policies exist (expected 4)'
        ELSE '❌ FAIL: No policies found'
    END as result
FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart';

-- Test 4: List all policies (should be 4)
-- ============================================
SELECT 
    'Test 4: Policy Details' as test,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual::text LIKE '%auth.uid()%' AND qual::text LIKE '%user_id%' 
        THEN '✅ Correct'
        ELSE '❌ Wrong condition'
    END as security_check
FROM pg_policies 
WHERE tablename = 'buyer_add_to_cart'
ORDER BY cmd;

-- Test 5: Check indexes exist
-- ============================================
SELECT 
    'Test 5: Indexes' as test,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS: Indexes exist'
        WHEN COUNT(*) = 1 THEN '⚠️ WARNING: Only 1 index exists'
        ELSE '❌ FAIL: No indexes found'
    END as result
FROM pg_indexes 
WHERE tablename = 'buyer_add_to_cart';

-- Test 6: List all indexes
-- ============================================
SELECT 
    'Test 6: Index Details' as test,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'buyer_add_to_cart'
ORDER BY indexname;

-- Test 7: Check permissions
-- ============================================
SELECT 
    'Test 7: Permissions' as test,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'buyer_add_to_cart'
ORDER BY grantee, privilege_type;

-- Test 8: Check trigger exists
-- ============================================
SELECT 
    'Test 8: Update Trigger' as test,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: Trigger exists'
        ELSE '⚠️ WARNING: No trigger found (updated_at won\'t auto-update)'
    END as result
FROM information_schema.triggers
WHERE event_object_table = 'buyer_add_to_cart'
AND trigger_name LIKE '%updated_at%';

-- ============================================
-- Summary
-- ============================================
SELECT '═══════════════════════════════════════' as divider;
SELECT '           TEST SUMMARY' as header;
SELECT '═══════════════════════════════════════' as divider;

SELECT 
    COUNT(*) FILTER (WHERE result LIKE '✅%') as passed_tests,
    COUNT(*) FILTER (WHERE result LIKE '❌%') as failed_tests,
    COUNT(*) FILTER (WHERE result LIKE '⚠️%') as warnings
FROM (
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'buyer_add_to_cart'
            ) THEN '✅ PASS'
            ELSE '❌ FAIL'
        END as result
    UNION ALL
    SELECT 
        CASE 
            WHEN rowsecurity = true THEN '✅ PASS'
            ELSE '❌ FAIL'
        END
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'buyer_add_to_cart'
    UNION ALL
    SELECT 
        CASE 
            WHEN COUNT(*) = 4 THEN '✅ PASS'
            WHEN COUNT(*) > 0 THEN '⚠️ WARNING'
            ELSE '❌ FAIL'
        END
    FROM pg_policies 
    WHERE tablename = 'buyer_add_to_cart'
) tests;

-- ============================================
-- Expected Results:
-- ============================================
-- Test 1: ✅ PASS: Table exists
-- Test 2: ✅ PASS: RLS is enabled
-- Test 3: ✅ PASS: All 4 policies exist
-- Test 4: Should show 4 policies with ✅ Correct
-- Test 5: ✅ PASS: Indexes exist
-- Test 6: Should show 2+ indexes
-- Test 7: Should show authenticated user permissions
-- Test 8: ✅ PASS: Trigger exists
-- Summary: 8 passed, 0 failed, 0 warnings
-- ============================================

-- Optional: View sample data (will be empty initially)
-- SELECT * FROM public.buyer_add_to_cart LIMIT 5;
