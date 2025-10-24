-- Temporarily Disable RLS for Reports Table (FOR TESTING ONLY)
-- This will allow all authenticated users to insert, view, and update reports
-- WARNING: This reduces security - only use for testing!

-- Disable RLS temporarily
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later, run:
-- ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- Then run the FIX_REPORTS_RLS_POLICIES.sql script
