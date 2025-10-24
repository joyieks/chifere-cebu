-- Add delivered_at column to buyer_orders table if it doesn't exist
-- This column will track when an order was delivered to the customer

-- Check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'delivered_at'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE public.buyer_orders 
        ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Column delivered_at added to buyer_orders table';
    ELSE
        RAISE NOTICE 'Column delivered_at already exists in buyer_orders table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'buyer_orders'
AND table_schema = 'public'
AND column_name = 'delivered_at';
