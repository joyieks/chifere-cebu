import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple script to help you run the notification fix
console.log('🔧 Chifere Notification Trigger Fix');
console.log('=====================================\n');

console.log('📋 This script will help you fix the notification triggers in your Supabase database.');
console.log('The issue is that when orders are created, the seller_id might be null, causing notification failures.\n');

console.log('🚀 To fix this issue, you have two options:\n');

console.log('OPTION 1: Manual SQL Execution (Recommended)');
console.log('--------------------------------------------');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy the contents of fix_notification_trigger.sql');
console.log('4. Paste and execute the SQL statements\n');

console.log('OPTION 2: Automated Fix (Requires Service Role Key)');
console.log('---------------------------------------------------');
console.log('1. Get your Supabase Service Role Key from Project Settings > API');
console.log('2. Set environment variables:');
console.log('   - VITE_SUPABASE_URL=your_project_url');
console.log('   - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
console.log('3. Run: node fix_notification_triggers_supabase.js\n');

// Check if we can access the current system
async function checkSystem() {
  try {
    // Try to read environment variables from a .env file if it exists
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      let supabaseUrl = '';
      let supabaseKey = '';
      
      lines.forEach(line => {
        if (line.startsWith('VITE_SUPABASE_URL=')) {
          supabaseUrl = line.split('=')[1];
        }
        if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
          supabaseKey = line.split('=')[1];
        }
      });
      
      if (supabaseUrl && supabaseKey) {
        console.log('✅ Found Supabase configuration in .env file');
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test connection
        const { data, error } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);
        
        if (error) {
          console.log('⚠️  Could not connect to notifications table:', error.message);
        } else {
          console.log('✅ Successfully connected to Supabase');
          console.log('📋 You can now test the notification system');
        }
      } else {
        console.log('⚠️  Supabase configuration not found in .env file');
      }
    } else {
      console.log('⚠️  No .env file found');
    }
  } catch (error) {
    console.log('⚠️  Could not check system:', error.message);
  }
}

// Show the SQL content that needs to be executed
function showSQLContent() {
  try {
    const sqlPath = path.join(__dirname, 'fix_notification_trigger.sql');
    if (fs.existsSync(sqlPath)) {
      console.log('\n📄 SQL Content to Execute:');
      console.log('==========================');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      console.log(sqlContent);
    }
  } catch (error) {
    console.log('❌ Could not read SQL file:', error.message);
  }
}

// Main execution
async function main() {
  await checkSystem();
  showSQLContent();
  
  console.log('\n🎯 Summary:');
  console.log('The notification trigger fix addresses the "null value in column user_id" error');
  console.log('by adding proper null checks and fallback logic to get seller_id from order items.');
  console.log('\nAfter applying the fix, new orders should properly notify sellers!');
}

main();
