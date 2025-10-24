// Simple test to verify if RLS fix worked
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your actual URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSFix() {
  console.log('🧪 Testing RLS fix...');
  
  try {
    // Test 1: Try to read from user_profiles table
    console.log('🧪 Test 1: Reading from user_profiles table...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, display_name, profile_image')
      .limit(5);
    
    console.log('user_profiles result:', { profiles, profileError });
    
    // Test 2: Try to read from buyer_users table
    console.log('🧪 Test 2: Reading from buyer_users table...');
    const { data: buyers, error: buyerError } = await supabase
      .from('buyer_users')
      .select('id, display_name, profile_image')
      .limit(5);
    
    console.log('buyer_users result:', { buyers, buyerError });
    
    if (profileError) {
      console.error('❌ user_profiles table access failed:', profileError);
    } else {
      console.log('✅ user_profiles table access successful');
    }
    
    if (buyerError) {
      console.error('❌ buyer_users table access failed:', buyerError);
    } else {
      console.log('✅ buyer_users table access successful');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRLSFix();
