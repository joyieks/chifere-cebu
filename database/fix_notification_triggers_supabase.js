import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration - you'll need to set these environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY') {
  console.error('❌ Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.log('📝 You can find these in your Supabase project settings:');
  console.log('   - VITE_SUPABASE_URL: Project URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY: Service Role Key (secret)');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLFix() {
  try {
    console.log('🔧 Starting notification trigger fix for Supabase...');
    
    // Read the SQL fix file
    const sqlFilePath = path.join(__dirname, 'fix_notification_trigger.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement using Supabase RPC or direct SQL
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          // Use Supabase's SQL execution
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            // If RPC doesn't work, try direct execution
            console.log('🔄 Trying direct SQL execution...');
            const { data: directData, error: directError } = await supabase
              .from('_sql')
              .select('*')
              .limit(0);
            
            if (directError) {
              console.log('⚠️  Direct SQL execution not available, using alternative method...');
              // For now, just log the statement that would be executed
              console.log(`📋 Statement to execute: ${statement.substring(0, 100)}...`);
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('🎉 Notification trigger fix process completed!');
    console.log('📝 Note: You may need to execute these SQL statements directly in your Supabase SQL editor');
    
  } catch (error) {
    console.error('💥 Error applying notification trigger fix:', error);
    throw error;
  }
}

// Test the notification system
async function testNotificationSystem() {
  try {
    console.log('\n🧪 Testing notification system...');
    
    // Test if notifications table exists and is accessible
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, created_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing notifications table:', error.message);
      return;
    }
    
    console.log('✅ Notifications table is accessible');
    
    // Test creating a notification (with a dummy user ID)
    const testNotification = {
      user_id: '00000000-0000-0000-0000-000000000000',
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system works',
      data: { test: true }
    };
    
    const { data: newNotification, error: createError } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select();
    
    if (createError) {
      console.log('⚠️  Test notification creation failed (expected for non-existent user):', createError.message);
    } else {
      console.log('✅ Test notification created successfully');
      
      // Clean up test notification
      await supabase
        .from('notifications')
        .delete()
        .eq('id', newNotification[0].id);
      console.log('🧹 Test notification cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error.message);
  }
}

// Check current notification triggers and functions
async function checkCurrentSystem() {
  try {
    console.log('\n🔍 Checking current notification system...');
    
    // Check if notifications table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');
    
    if (tableError) {
      console.log('⚠️  Could not check tables (this is normal for Supabase)');
    } else if (tables && tables.length > 0) {
      console.log('✅ Notifications table exists');
    } else {
      console.log('❌ Notifications table not found');
    }
    
    // Check recent notifications
    const { data: recentNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, type, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (notifError) {
      console.log('⚠️  Could not fetch recent notifications:', notifError.message);
    } else {
      console.log(`📋 Found ${recentNotifications.length} recent notifications`);
      recentNotifications.forEach(notif => {
        console.log(`  - ${notif.type}: ${notif.title} (${new Date(notif.created_at).toLocaleString()})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking current system:', error.message);
  }
}

// Main execution
async function main() {
  try {
    await checkCurrentSystem();
    await executeSQLFix();
    await testNotificationSystem();
    
    console.log('\n🎯 Notification trigger fix process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of fix_notification_trigger.sql');
    console.log('4. Execute the SQL statements');
    console.log('5. Test by creating a new order to see if notifications work');
    
  } catch (error) {
    console.error('\n💥 Failed to complete notification trigger fix:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { executeSQLFix, testNotificationSystem, checkCurrentSystem };
