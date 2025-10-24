// Debug script to check participant data in database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugParticipants() {
  console.log('🔍 Debugging participant data...');
  
  // Test participant IDs from the logs
  const testIds = [
    'd7f43ccd-3576-43e3-ac94-ec60c7674df9',
    '634b1c84-ef61-4d27-9695-7ed4e0bca1b5'
  ];
  
  console.log('🔍 Testing participant IDs:', testIds);
  
  // Check user_profiles table
  console.log('\n🔍 Checking user_profiles table...');
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, display_name, profile_image, user_type')
    .in('id', testIds);
    
  console.log('user_profiles result:', { profileData, profileError });
  
  // Check buyer_users table
  console.log('\n🔍 Checking buyer_users table...');
  const { data: buyerData, error: buyerError } = await supabase
    .from('buyer_users')
    .select('id, display_name, profile_image')
    .in('id', testIds);
    
  console.log('buyer_users result:', { buyerData, buyerError });
  
  // Check what tables exist
  console.log('\n🔍 Checking available tables...');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
    
  console.log('Available tables:', { tables, tablesError });
}

debugParticipants().catch(console.error);
