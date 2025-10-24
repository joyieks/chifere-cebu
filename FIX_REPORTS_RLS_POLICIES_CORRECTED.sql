-- Fix RLS Policies for Reports Table (Corrected Version)
-- This script properly handles existing policies

-- Drop ALL existing policies first (using IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated users to insert reports" ON public.reports;
DROP POLICY IF EXISTS "Allow users to view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Allow users to update their own reports" ON public.reports;
DROP POLICY IF EXISTS "Allow service role full access" ON public.reports;

-- Now create the new policies
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

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reports';
