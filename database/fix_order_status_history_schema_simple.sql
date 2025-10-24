-- Fix order_status_history table schema (Simple Version - No Test Insert)
-- Add missing status_type column and fix any other schema issues

-- Step 1: Check if order_status_history table exists and its current structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_status_history' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check what valid status values are allowed
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.order_status_history'::regclass 
AND contype = 'c';

-- Step 3: Add missing status_type column if it doesn't exist
DO $$
BEGIN
    -- Check if status_type column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_status_history' 
        AND column_name = 'status_type'
        AND table_schema = 'public'
    ) THEN
        -- Add the status_type column
        ALTER TABLE public.order_status_history 
        ADD COLUMN status_type VARCHAR(50);
        
        RAISE NOTICE 'Added status_type column to order_status_history table';
    ELSE
        RAISE NOTICE 'status_type column already exists in order_status_history table';
    END IF;
END $$;

-- Step 4: Update existing records to have a default status_type
UPDATE public.order_status_history 
SET status_type = 'manual_update'
WHERE status_type IS NULL;

-- Step 5: Make status_type NOT NULL with a default value
ALTER TABLE public.order_status_history 
ALTER COLUMN status_type SET DEFAULT 'manual_update',
ALTER COLUMN status_type SET NOT NULL;

-- Step 6: Add any other missing columns that might be needed
DO $$
BEGIN
    -- Check if created_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_status_history' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.order_status_history 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added created_at column to order_status_history table';
    END IF;
    
    -- Check if updated_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_status_history' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.order_status_history 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column to order_status_history table';
    END IF;
END $$;

-- Step 7: Create or update the updated_at trigger
CREATE OR REPLACE FUNCTION update_order_status_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_order_status_history_updated_at ON public.order_status_history;

-- Create the trigger
CREATE TRIGGER trigger_update_order_status_history_updated_at
    BEFORE UPDATE ON public.order_status_history
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_history_updated_at();

-- Step 8: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_status_history TO anon;

-- Step 9: Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_status_history' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 10: Check existing status values in the table to see what's valid
SELECT DISTINCT status 
FROM public.order_status_history 
ORDER BY status;

-- Step 11: Check existing status values in buyer_orders to see what's valid
SELECT DISTINCT status 
FROM public.buyer_orders 
ORDER BY status;

-- Step 12: Show constraint details to understand what's being validated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.order_status_history'::regclass 
ORDER BY conname;

SELECT 'Order Status History Schema Fix Applied Successfully (No Test Insert)' as status;
