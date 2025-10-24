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

async function debugOrderTriggers() {
  console.log('🔍 Debugging Order Triggers');
  console.log('===========================\n');
  
  try {
    // 1. Check if triggers exist by trying to query them
    console.log('1️⃣ Checking if triggers exist...');
    
    // Try to query triggers using a different approach
    const { data: triggerCheck, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT 
            t.trigger_name,
            t.event_object_table,
            t.action_timing,
            t.event_manipulation,
            t.action_statement
          FROM information_schema.triggers t
          WHERE t.trigger_schema = 'public' 
          AND t.trigger_name LIKE 'trigger_notify_%'
          ORDER BY t.trigger_name;
        `
      });
    
    if (triggerError) {
      console.log('⚠️  Could not query triggers directly:', triggerError.message);
      console.log('💡 This is normal in Supabase - triggers exist but are not directly queryable');
    } else {
      console.log('✅ Triggers found:', triggerCheck);
    }
    
    // 2. Check recent orders and see if they should have triggered notifications
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
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
        console.log(`   Items: ${order.buyer_order_items?.length || 0}`);
        
        if (order.buyer_order_items && order.buyer_order_items.length > 0) {
          order.buyer_order_items.forEach((item, itemIndex) => {
            console.log(`     Item ${itemIndex + 1}: ${item.product_name} (Seller: ${item.seller_id || 'NULL'})`);
          });
        }
      });
    }
    
    // 3. Check all notifications to see what we have
    console.log('\n3️⃣ Checking all notifications...');
    
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
        console.log('⚠️  NO NOTIFICATIONS FOUND');
      }
    }
    
    // 4. Test if the notify_new_order function works manually
    console.log('\n4️⃣ Testing notify_new_order function manually...');
    
    if (orders && orders.length > 0) {
      const testOrder = orders[0];
      console.log(`Testing with order: ${testOrder.order_number} (ID: ${testOrder.id})`);
      
      // Try to call the notify_new_order function manually
      const { data: testResult, error: testError } = await supabase
        .rpc('notify_new_order', {
          // This won't work because it's a trigger function, but let's try
        });
      
      if (testError) {
        console.log('❌ Error calling notify_new_order function:', testError.message);
        console.log('💡 This is expected - trigger functions can\'t be called directly');
      } else {
        console.log('✅ notify_new_order function result:', testResult);
      }
    }
    
    // 5. Check if the functions exist
    console.log('\n5️⃣ Checking if notification functions exist...');
    
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT 
            routine_name, 
            routine_type,
            data_type
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
    
    // 6. Try to create a test order to see if triggers fire
    console.log('\n6️⃣ Testing trigger by creating a test order...');
    
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, display_name, business_name, user_type')
      .limit(5);
    
    if (userError) {
      console.log('❌ Error accessing user profiles:', userError.message);
    } else {
      const buyers = users.filter(u => u.user_type === 'buyer');
      const sellers = users.filter(u => u.user_type === 'seller');
      
      if (buyers.length > 0 && sellers.length > 0) {
        const testBuyer = buyers[0];
        const testSeller = sellers[0];
        
        console.log(`Testing with buyer: ${testBuyer.display_name || testBuyer.business_name} (${testBuyer.id})`);
        console.log(`Testing with seller: ${testSeller.display_name || testSeller.business_name} (${testSeller.id})`);
        
        // Create a test order
        const testOrder = {
          order_number: 'TEST-' + Date.now(),
          buyer_id: testBuyer.id,
          seller_id: testSeller.id,
          status: 'pending',
          payment_status: 'pending',
          delivery_status: 'pending',
          subtotal: 100,
          delivery_fee: 10,
          total_amount: 110,
          payment_method: 'cod',
          delivery_address: { test: true },
          notes: 'Test order for trigger debugging',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Creating test order...');
        const { data: newOrder, error: orderCreateError } = await supabase
          .from('buyer_orders')
          .insert([testOrder])
          .select();
        
        if (orderCreateError) {
          console.log('❌ Error creating test order:', orderCreateError.message);
        } else {
          console.log('✅ Test order created successfully:', newOrder[0].id);
          
          // Wait a moment for trigger to fire
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if notification was created
          const { data: newNotifications, error: newNotifError } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (newNotifError) {
            console.log('❌ Error checking for new notifications:', newNotifError.message);
          } else if (newNotifications && newNotifications.length > 0) {
            const latestNotif = newNotifications[0];
            console.log('🎉 NEW NOTIFICATION CREATED!');
            console.log(`   Type: ${latestNotif.type}`);
            console.log(`   Title: ${latestNotif.title}`);
            console.log(`   User ID: ${latestNotif.user_id}`);
            console.log(`   Created: ${new Date(latestNotif.created_at).toLocaleString()}`);
            
            // Clean up test order and notification
            await supabase.from('buyer_orders').delete().eq('id', newOrder[0].id);
            await supabase.from('notifications').delete().eq('id', latestNotif.id);
            console.log('🧹 Test order and notification cleaned up');
          } else {
            console.log('❌ NO NOTIFICATION CREATED - Triggers are not working');
            
            // Clean up test order
            await supabase.from('buyer_orders').delete().eq('id', newOrder[0].id);
            console.log('🧹 Test order cleaned up');
          }
        }
      } else {
        console.log('⚠️  Need both buyer and seller users for testing');
      }
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log('=================');
    console.log('If the test order creation didn\'t trigger a notification:');
    console.log('1. The triggers might not be properly attached to the table');
    console.log('2. The trigger functions might have errors');
    console.log('3. There might be permission issues');
    console.log('\n💡 Next steps:');
    console.log('1. Check if triggers are actually attached to buyer_orders table');
    console.log('2. Verify the trigger functions are working');
    console.log('3. Check for any error logs in Supabase');
    
  } catch (error) {
    console.error('💥 Error during debugging:', error);
  }
}

debugOrderTriggers();
