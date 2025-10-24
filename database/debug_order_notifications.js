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

async function debugOrderNotifications() {
  console.log('🔍 Debugging Order Notifications');
  console.log('================================\n');
  
  try {
    // 1. Check if triggers exist
    console.log('1️⃣ Checking if notification triggers exist...');
    
    // We can't directly query triggers in Supabase, but we can check if the functions exist
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT routine_name 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name IN ('notify_new_order', 'notify_order_status_update', 'create_notification')
          ORDER BY routine_name;
        `
      });
    
    if (funcError) {
      console.log('⚠️  Could not check functions directly, trying alternative method...');
    } else {
      console.log('✅ Functions found:', functions);
    }
    
    // 2. Check recent orders and their structure
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
      .limit(3);
    
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
        console.log(`   Total: $${order.total_amount}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
        console.log(`   Items: ${order.buyer_order_items?.length || 0}`);
        
        if (order.buyer_order_items && order.buyer_order_items.length > 0) {
          order.buyer_order_items.forEach((item, itemIndex) => {
            console.log(`     Item ${itemIndex + 1}: ${item.product_name} (Seller: ${item.seller_id || 'NULL'})`);
          });
        }
      });
    }
    
    // 3. Check recent notifications
    console.log('\n3️⃣ Checking recent notifications...');
    
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, type, title, message, user_id, created_at, data')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (notifError) {
      console.log('❌ Error accessing notifications:', notifError.message);
    } else {
      console.log(`✅ Found ${notifications.length} recent notifications`);
      if (notifications.length > 0) {
        notifications.forEach((notif, index) => {
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
        console.log('⚠️  No notifications found - this might indicate the triggers are not working');
      }
    }
    
    // 4. Check user profiles to see if we have valid users
    console.log('\n4️⃣ Checking user profiles...');
    
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, display_name, business_name, user_type')
      .limit(5);
    
    if (userError) {
      console.log('❌ Error accessing user profiles:', userError.message);
    } else {
      console.log(`✅ Found ${users.length} users`);
      const buyers = users.filter(u => u.user_type === 'buyer');
      const sellers = users.filter(u => u.user_type === 'seller');
      console.log(`   - Buyers: ${buyers.length}`);
      console.log(`   - Sellers: ${sellers.length}`);
      
      if (sellers.length > 0) {
        console.log('   Sample sellers:');
        sellers.forEach((seller, index) => {
          console.log(`     ${index + 1}. ${seller.display_name || seller.business_name} (${seller.id})`);
        });
      }
    }
    
    // 5. Test manual notification creation
    console.log('\n5️⃣ Testing manual notification creation...');
    
    if (users && users.length > 0) {
      const testUser = users.find(u => u.user_type === 'seller') || users[0];
      console.log(`Testing with user: ${testUser.display_name || testUser.business_name} (${testUser.id})`);
      
      const testNotification = {
        user_id: testUser.id,
        type: 'new_order_received',
        title: 'Debug Test - New Order',
        message: 'This is a test notification to verify the system works',
        data: { 
          test: true, 
          timestamp: new Date().toISOString(),
          order_id: 'debug-test-123'
        }
      };
      
      const { data: newNotification, error: createError } = await supabase
        .from('notifications')
        .insert([testNotification])
        .select();
      
      if (createError) {
        console.log('❌ Error creating test notification:', createError.message);
        if (createError.message.includes('row-level security')) {
          console.log('💡 RLS is blocking direct insertion - this is expected');
        }
      } else {
        console.log('✅ Test notification created successfully');
        console.log(`   Notification ID: ${newNotification[0].id}`);
        
        // Clean up test notification
        await supabase
          .from('notifications')
          .delete()
          .eq('id', newNotification[0].id);
        console.log('🧹 Test notification cleaned up');
      }
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log('=================');
    console.log('If you see orders but no notifications, the triggers might not be working.');
    console.log('This could be due to:');
    console.log('1. Triggers not being created properly');
    console.log('2. RLS policies blocking trigger execution');
    console.log('3. Functions not having proper permissions');
    console.log('\n💡 Next steps:');
    console.log('1. Check if the triggers were created in Supabase SQL Editor');
    console.log('2. Verify the RLS policies allow trigger execution');
    console.log('3. Test by creating a new order and checking notifications');
    
  } catch (error) {
    console.error('💥 Error during debugging:', error);
  }
}

debugOrderNotifications();
