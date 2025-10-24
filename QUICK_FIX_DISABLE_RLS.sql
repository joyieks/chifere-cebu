-- Quick Fix: Disable RLS for Reports Table
-- This will immediately fix the report submission issue

-- Disable RLS temporarily
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';

-- To re-enable RLS later with proper policies, run:
-- ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- Then run the FIX_REPORTS_RLS_POLICIES_CORRECTED.sql script
