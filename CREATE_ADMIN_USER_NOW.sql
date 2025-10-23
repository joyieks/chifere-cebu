-- Create admin user with email admin@gmail.com and password admin123
-- Run this in your Supabase SQL Editor

-- First, check if admin_users table exists, if not create it
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to read their own data
DROP POLICY IF EXISTS "Admins can read own data" ON public.admin_users;
CREATE POLICY "Admins can read own data" ON public.admin_users
    FOR SELECT
    USING (true);

-- Delete any existing admin@gmail.com user
DELETE FROM public.admin_users WHERE email = 'admin@gmail.com';

-- Insert the admin user with plain text password (will be checked in app)
INSERT INTO public.admin_users (email, password_hash, first_name, last_name, role)
VALUES ('admin@gmail.com', 'admin123', 'Admin', 'User', 'super_admin');

-- Verify the admin user was created
SELECT * FROM public.admin_users WHERE email = 'admin@gmail.com';
