-- Remove duplicate products from seller tables
-- This script will help identify and remove duplicate products

-- First, let's see what duplicates exist
SELECT 
  name, 
  seller_id, 
  COUNT(*) as duplicate_count,
  array_agg(id) as product_ids
FROM public.seller_add_item_preloved 
GROUP BY name, seller_id 
HAVING COUNT(*) > 1;

SELECT 
  name, 
  seller_id, 
  COUNT(*) as duplicate_count,
  array_agg(id) as product_ids
FROM public.seller_add_barter_item 
GROUP BY name, seller_id 
HAVING COUNT(*) > 1;

-- Remove duplicates from seller_add_item_preloved
-- Keep the oldest product (first created) and delete the rest
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, seller_id 
      ORDER BY created_at ASC
    ) as rn
  FROM public.seller_add_item_preloved
)
DELETE FROM public.seller_add_item_preloved 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Remove duplicates from seller_add_barter_item
-- Keep the oldest product (first created) and delete the rest
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, seller_id 
      ORDER BY created_at ASC
    ) as rn
  FROM public.seller_add_barter_item
)
DELETE FROM public.seller_add_barter_item 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Check results after cleanup
SELECT 'Preloved items after cleanup:' as info, COUNT(*) as count FROM public.seller_add_item_preloved;
SELECT 'Barter items after cleanup:' as info, COUNT(*) as count FROM public.seller_add_barter_item;


