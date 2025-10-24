-- Add cancellation columns to buyer_orders table
-- This script adds the missing columns needed for order cancellation

-- Check if columns already exist before adding them
DO $$ 
BEGIN
    -- Add cancellation_reason column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE public.buyer_orders 
        ADD COLUMN cancellation_reason TEXT;
        RAISE NOTICE 'Added cancellation_reason column';
    ELSE
        RAISE NOTICE 'cancellation_reason column already exists';
    END IF;

    -- Add cancelled_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.buyer_orders 
        ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added cancelled_at column';
    ELSE
        RAISE NOTICE 'cancelled_at column already exists';
    END IF;

    -- Add cancelled_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'cancelled_by'
    ) THEN
        ALTER TABLE public.buyer_orders 
        ADD COLUMN cancelled_by TEXT;
        RAISE NOTICE 'Added cancelled_by column';
    ELSE
        RAISE NOTICE 'cancelled_by column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
AND column_name IN ('cancellation_reason', 'cancelled_at', 'cancelled_by')
ORDER BY column_name;
