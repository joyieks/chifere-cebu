-- Add columns for order cancellation if they don't exist
-- This will ensure the database supports order cancellation

-- Check if cancellation_reason column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE buyer_orders ADD COLUMN cancellation_reason TEXT;
        RAISE NOTICE 'Added cancellation_reason column';
    ELSE
        RAISE NOTICE 'cancellation_reason column already exists';
    END IF;
END $$;

-- Check if cancelled_at column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE buyer_orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added cancelled_at column';
    ELSE
        RAISE NOTICE 'cancelled_at column already exists';
    END IF;
END $$;

-- Check if cancelled_by column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buyer_orders' 
        AND column_name = 'cancelled_by'
    ) THEN
        ALTER TABLE buyer_orders ADD COLUMN cancelled_by UUID;
        RAISE NOTICE 'Added cancelled_by column';
    ELSE
        RAISE NOTICE 'cancelled_by column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 'Updated buyer_orders table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buyer_orders' 
AND column_name IN ('cancellation_reason', 'cancelled_at', 'cancelled_by')
ORDER BY column_name;

SELECT 'Order cancellation columns added successfully!' as message;
