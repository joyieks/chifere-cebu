-- Clean up duplicate notifications
-- Remove duplicate order status update notifications

-- Step 1: Check for duplicate notifications
SELECT 
    user_id,
    type,
    data->>'order_id' as order_id,
    data->>'new_status' as new_status,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as notification_ids
FROM public.notifications 
WHERE type = 'order_status_update'
GROUP BY user_id, type, data->>'order_id', data->>'new_status'
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Delete duplicate notifications (keep only the most recent one)
WITH duplicate_notifications AS (
    SELECT 
        id,
        user_id,
        type,
        data->>'order_id' as order_id,
        data->>'new_status' as new_status,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, type, data->>'order_id', data->>'new_status' 
            ORDER BY created_at DESC
        ) as rn
    FROM public.notifications 
    WHERE type = 'order_status_update'
)
DELETE FROM public.notifications 
WHERE id IN (
    SELECT id 
    FROM duplicate_notifications 
    WHERE rn > 1
);

-- Step 3: Show remaining notifications after cleanup
SELECT 
    'Notifications after cleanup' as status,
    COUNT(*) as total_notifications
FROM public.notifications 
WHERE type = 'order_status_update';

-- Step 4: Show unique order status update notifications
SELECT 
    user_id,
    type,
    title,
    message,
    data->>'order_id' as order_id,
    data->>'new_status' as new_status,
    created_at
FROM public.notifications 
WHERE type = 'order_status_update'
ORDER BY created_at DESC
LIMIT 10;

SELECT 'Duplicate notifications cleaned up successfully' as status;
