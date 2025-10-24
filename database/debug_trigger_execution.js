import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables from .env file
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnvVars();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase configuration not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTriggerExecution() {
  console.log('🔍 Debugging Trigger Execution');
  console.log('==============================\n');
  
  try {
    // 1. Check if triggers actually exist
    console.log('1️⃣ Checking if triggers exist...');
    
    // Try to query triggers directly
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT 
            trigger_name,
            event_object_table,
            action_timing,
            event_manipulation
          FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND trigger_name LIKE 'trigger_notify_%'
          ORDER BY trigger_name;
        `
      });
    
    if (triggerError) {
      console.log('⚠️  Could not query triggers directly:', triggerError.message);
      console.log('💡 This is normal in Supabase - triggers exist but are not directly queryable');
    } else {
      console.log('✅ Triggers found:', triggers);
    }
    
    // 2. Check recent orders to see if they should have triggered notifications
    console.log('\n2️⃣ Checking recent orders...');
    
    const { data: orders, error: orderError } = await supabase
      .from('buyer_orders')
      .select(`
        id,
        order_number,
        buyer_id,
        seller_id,
        status,
        total_amount,
        created_at,
        buyer_order_items (
          id,
          seller_id,
          product_name,
          quantity
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (orderError) {
      console.log('❌ Error accessing orders:', orderError.message);
    } else {
      console.log(`✅ Found ${orders.length} recent orders`);
      orders.forEach((order, index) => {
        console.log(`\n📦 Order ${index + 1}:`);
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Order Number: ${order.order_number}`);
        console.log(`   Buyer ID: ${order.buyer_id}`);
        console.log(`   Seller ID: ${order.seller_id || 'NULL'}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
        console.log(`   Items: ${order.buyer_order_items?.length || 0}`);
        
        if (order.buyer_order_items && order.buyer_order_items.length > 0) {
          order.buyer_order_items.forEach((item, itemIndex) => {
            console.log(`     Item ${itemIndex + 1}: ${item.product_name} (Seller: ${item.seller_id || 'NULL'})`);
          });
        }
      });
    }
    
    // 3. Check all notifications (not just recent ones)
    console.log('\n3️⃣ Checking ALL notifications...');
    
    const { data: allNotifications, error: allNotifError } = await supabase
      .from('notifications')
      .select('id, type, title, message, user_id, created_at, data')
      .order('created_at', { ascending: false });
    
    if (allNotifError) {
      console.log('❌ Error accessing notifications:', allNotifError.message);
    } else {
      console.log(`✅ Found ${allNotifications.length} total notifications`);
      if (allNotifications.length > 0) {
        console.log('📋 All notifications:');
        allNotifications.forEach((notif, index) => {
          console.log(`\n🔔 Notification ${index + 1}:`);
          console.log(`   Type: ${notif.type}`);
          console.log(`   Title: ${notif.title}`);
          console.log(`   User ID: ${notif.user_id}`);
          console.log(`   Created: ${new Date(notif.created_at).toLocaleString()}`);
          if (notif.data) {
            console.log(`   Data: ${JSON.stringify(notif.data, null, 2)}`);
          }
        });
      } else {
        console.log('⚠️  NO NOTIFICATIONS FOUND - This confirms triggers are not working');
      }
    }
    
    // 4. Test manual notification creation to see if the function works
    console.log('\n4️⃣ Testing manual notification creation...');
    
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, display_name, business_name, user_type')
      .limit(5);
    
    if (userError) {
      console.log('❌ Error accessing user profiles:', userError.message);
    } else {
      const sellers = users.filter(u => u.user_type === 'seller');
      if (sellers.length > 0) {
        const testSeller = sellers[0];
        console.log(`Testing with seller: ${testSeller.display_name || testSeller.business_name} (${testSeller.id})`);
        
        // Try to call the create_notification function directly
        const { data: testResult, error: testError } = await supabase
          .rpc('create_notification', {
            p_user_id: testSeller.id,
            p_type: 'new_order_received',
            p_title: 'Manual Test Notification',
            p_message: 'This is a manual test to verify the function works',
            p_data: { test: true, manual: true }
          });
        
        if (testError) {
          console.log('❌ Error calling create_notification function:', testError.message);
        } else {
          console.log('✅ Manual notification creation result:', testResult);
          
          // Check if the notification was actually created
          const { data: checkNotif, error: checkError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', testSeller.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (checkError) {
            console.log('❌ Error checking created notification:', checkError.message);
          } else if (checkNotif && checkNotif.length > 0) {
            console.log('✅ Notification was created successfully!');
            console.log('   Notification ID:', checkNotif[0].id);
            console.log('   Title:', checkNotif[0].title);
            
            // Clean up test notification
            await supabase
              .from('notifications')
              .delete()
              .eq('id', checkNotif[0].id);
            console.log('🧹 Test notification cleaned up');
          } else {
            console.log('⚠️  Function returned success but no notification was created');
          }
        }
      } else {
        console.log('⚠️  No seller users found for testing');
      }
    }
    
    // 5. Check if the notification functions exist
    console.log('\n5️⃣ Checking if notification functions exist...');
    
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT routine_name, routine_type
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name IN ('create_notification', 'notify_new_order', 'notify_order_status_update')
          ORDER BY routine_name;
        `
      });
    
    if (funcError) {
      console.log('⚠️  Could not query functions directly:', funcError.message);
    } else {
      console.log('✅ Functions found:', functions);
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log('=================');
    console.log('If no notifications are found and manual creation fails:');
    console.log('1. The triggers might not have been created properly');
    console.log('2. The functions might not have the right permissions');
    console.log('3. There might be an issue with the RLS policies');
    console.log('\n💡 Next steps:');
    console.log('1. Re-run the complete notification system SQL');
    console.log('2. Check if all functions and triggers were created');
    console.log('3. Verify the RLS policies are correct');
    
  } catch (error) {
    console.error('💥 Error during debugging:', error);
  }
}

debugTriggerExecution();
