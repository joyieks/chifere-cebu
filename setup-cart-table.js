/**
 * Setup Cart Table Script
 * 
 * This script creates the missing buyer_add_to_cart table in your Supabase database.
 * Run this script to fix the cart functionality.
 * 
 * Instructions:
 * 1. Copy the SQL from CREATE_CART_TABLE.sql
 * 2. Go to your Supabase dashboard
 * 3. Navigate to SQL Editor
 * 4. Paste and run the SQL
 * 
 * Or run this script if you have the Supabase CLI configured.
 */

import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

const createCartTable = async () => {
  try {
    console.log('🔄 Creating buyer_add_to_cart table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.buyer_add_to_cart (
          id uuid NOT NULL DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL,
          items jsonb NOT NULL DEFAULT '[]'::jsonb,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          CONSTRAINT buyer_add_to_cart_pkey PRIMARY KEY (id),
          CONSTRAINT buyer_add_to_cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
        );
        
        CREATE UNIQUE INDEX IF NOT EXISTS buyer_add_to_cart_user_id_unique ON public.buyer_add_to_cart (user_id);
        
        ALTER TABLE public.buyer_add_to_cart ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own cart" ON public.buyer_add_to_cart;
        CREATE POLICY "Users can view their own cart" ON public.buyer_add_to_cart
          FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert their own cart" ON public.buyer_add_to_cart;
        CREATE POLICY "Users can insert their own cart" ON public.buyer_add_to_cart
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update their own cart" ON public.buyer_add_to_cart;
        CREATE POLICY "Users can update their own cart" ON public.buyer_add_to_cart
          FOR UPDATE USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete their own cart" ON public.buyer_add_to_cart;
        CREATE POLICY "Users can delete their own cart" ON public.buyer_add_to_cart
          FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (error) {
      console.error('❌ Error creating cart table:', error);
      return;
    }

    console.log('✅ Cart table created successfully!');
    console.log('🎉 Cart functionality should now work properly.');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
};

// Run the script
createCartTable();


