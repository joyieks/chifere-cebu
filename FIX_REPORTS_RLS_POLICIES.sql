-- Fix RLS Policies for Reports Table
-- Run this script to fix the row-level security policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated users to insert reports" ON public.reports;
DROP POLICY IF EXISTS "Allow users to view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Allow users to update their own reports" ON public.reports;
DROP POLICY IF EXISTS "Allow service role full access" ON public.reports;

-- Create simple, working policies
-- Policy 1: Allow any authenticated user to insert reports
CREATE POLICY "Allow authenticated users to insert reports" ON public.reports
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 2: Allow users to view their own reports
CREATE POLICY "Allow users to view their own reports" ON public.reports
FOR SELECT USING (auth.uid()::text = reporter_id::text);

-- Policy 3: Allow users to update their own reports
CREATE POLICY "Allow users to update their own reports" ON public.reports
FOR UPDATE USING (auth.uid()::text = reporter_id::text);

-- Policy 4: Allow service role full access (for admin operations)
CREATE POLICY "Allow service role full access" ON public.reports
FOR ALL USING (auth.role() = 'service_role');

-- Alternative: If you want to allow admins to see all reports, you can add this policy
-- (Make sure you have an admin_users table or adjust the condition)
-- CREATE POLICY "Allow admins to view all reports" ON public.reports
-- FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM public.admin_users 
--     WHERE id = auth.uid()
--   )
-- );

-- Alternative: If you want to temporarily disable RLS for testing, you can run:
-- ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
-- (But remember to re-enable it later for security)
