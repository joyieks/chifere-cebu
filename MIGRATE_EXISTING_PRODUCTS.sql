-- Migrate existing products from the 'products' table to the new seller product tables
-- This script will move your existing products to the correct tables

-- First, let's see what products exist in the current products table
-- (This is just for reference - you can run this to check your existing products)
-- SELECT id, name, seller_id, product_type, selling_mode, created_at FROM public.products;

-- Migrate preloved items (products with selling_mode = 'sell' or product_type = 'preloved')
INSERT INTO public.seller_add_item_preloved (
  id,
  seller_id,
  name,
  description,
  category,
  condition,
  location,
  brand,
  model,
  quantity,
  price,
  original_price,
  product_type,
  selling_mode,
  barter_preferences,
  estimated_value,
  images,
  primary_image,
  status,
  is_featured,
  is_verified,
  views,
  likes,
  shares,
  rating,
  total_ratings,
  sold_at,
  created_at,
  updated_at,
  is_barter_only,
  is_sell_only,
  is_both
)
SELECT 
  id,
  seller_id,
  name,
  description,
  category,
  condition,
  location,
  brand,
  model,
  quantity,
  price,
  original_price,
  product_type,
  selling_mode,
  barter_preferences,
  estimated_value,
  images,
  primary_image,
  status,
  is_featured,
  is_verified,
  views,
  likes,
  shares,
  rating,
  total_ratings,
  sold_at,
  created_at,
  updated_at,
  CASE 
    WHEN selling_mode = 'barter' OR product_type = 'barter' THEN true
    ELSE false
  END as is_barter_only,
  CASE 
    WHEN selling_mode = 'sell' OR product_type = 'preloved' THEN true
    ELSE false
  END as is_sell_only,
  CASE 
    WHEN selling_mode = 'both' THEN true
    ELSE false
  END as is_both
FROM public.products
WHERE selling_mode = 'sell' 
   OR product_type = 'preloved'
   OR (selling_mode != 'barter' AND product_type != 'barter');

-- Migrate barter items (products with selling_mode = 'barter' or product_type = 'barter')
INSERT INTO public.seller_add_barter_item (
  id,
  seller_id,
  name,
  description,
  category,
  condition,
  location,
  brand,
  model,
  quantity,
  price,
  original_price,
  product_type,
  selling_mode,
  barter_preferences,
  estimated_value,
  images,
  primary_image,
  status,
  is_featured,
  is_verified,
  views,
  likes,
  shares,
  rating,
  total_ratings,
  sold_at,
  created_at,
  updated_at,
  is_barter_only,
  is_sell_only,
  is_both
)
SELECT 
  id,
  seller_id,
  name,
  description,
  category,
  condition,
  location,
  brand,
  model,
  quantity,
  price,
  original_price,
  product_type,
  selling_mode,
  barter_preferences,
  estimated_value,
  images,
  primary_image,
  status,
  is_featured,
  is_verified,
  views,
  likes,
  shares,
  rating,
  total_ratings,
  sold_at,
  created_at,
  updated_at,
  CASE 
    WHEN selling_mode = 'barter' OR product_type = 'barter' THEN true
    ELSE false
  END as is_barter_only,
  CASE 
    WHEN selling_mode = 'sell' OR product_type = 'preloved' THEN true
    ELSE false
  END as is_sell_only,
  CASE 
    WHEN selling_mode = 'both' THEN true
    ELSE false
  END as is_both
FROM public.products
WHERE selling_mode = 'barter' 
   OR product_type = 'barter';

-- Optional: After migration is complete and verified, you can drop the old products table
-- WARNING: Only run this if you're sure the migration was successful!
-- DROP TABLE public.products;

-- Check the migration results
SELECT 'Preloved items migrated:' as info, COUNT(*) as count FROM public.seller_add_item_preloved;
SELECT 'Barter items migrated:' as info, COUNT(*) as count FROM public.seller_add_barter_item;
SELECT 'Original products count:' as info, COUNT(*) as count FROM public.products;


