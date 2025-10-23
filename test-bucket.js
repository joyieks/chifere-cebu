// Test script to verify product-images bucket exists and is accessible
import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucket() {
  try {
    console.log('🔍 Testing product-images bucket...');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('📦 Available buckets:', buckets.map(b => b.name));
    
    // Check if product-images bucket exists
    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    
    if (productImagesBucket) {
      console.log('✅ product-images bucket exists:', productImagesBucket);
      
      // Try to list files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('product-images')
        .list('', { limit: 10 });
        
      if (filesError) {
        console.error('❌ Error listing files:', filesError);
      } else {
        console.log('📁 Files in bucket:', files);
      }
    } else {
      console.log('❌ product-images bucket does not exist');
      console.log('💡 You need to run the SETUP_PRODUCT_IMAGES_STORAGE.sql script');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBucket();

