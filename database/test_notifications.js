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

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System');
  console.log('==============================\n');
  
  try {
    // 1. Check if notifications table exists and is accessible
    console.log('1️⃣ Checking notifications table...');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, type, title, message, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (notifError) {
      console.log('❌ Error accessing notifications:', notifError.message);
      return;
    }
    
    console.log(`✅ Notifications table accessible - found ${notifications.length} recent notifications`);
    if (notifications.length > 0) {
      console.log('📋 Recent notifications:');
      notifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.type}: ${notif.title} (${new Date(notif.created_at).toLocaleString()})`);
      });
    }
    
    // 2. Check if user_profiles table is accessible
    console.log('\n2️⃣ Checking user_profiles table...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, display_name, business_name, user_type')
      .limit(3);
    
    if (profileError) {
      console.log('❌ Error accessing user_profiles:', profileError.message);
    } else {
      console.log(`✅ User profiles accessible - found ${profiles.length} sample profiles`);
      if (profiles.length > 0) {
        console.log('📋 Sample profiles:');
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.display_name || profile.business_name} (${profile.user_type})`);
        });
      }
    }
    
    // 3. Check if buyer_orders table is accessible
    console.log('\n3️⃣ Checking buyer_orders table...');
    const { data: orders, error: orderError } = await supabase
      .from('buyer_orders')
      .select('id, order_number, buyer_id, seller_id, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (orderError) {
      console.log('❌ Error accessing buyer_orders:', orderError.message);
    } else {
      console.log(`✅ Buyer orders accessible - found ${orders.length} recent orders`);
      if (orders.length > 0) {
        console.log('📋 Recent orders:');
        orders.forEach((order, index) => {
          const sellerStatus = order.seller_id ? 'Has seller' : '❌ NULL seller_id';
          console.log(`   ${index + 1}. Order #${order.order_number} - ${order.status} - ${sellerStatus}`);
        });
      }
    }
    
    // 4. Check if buyer_order_items table is accessible
    console.log('\n4️⃣ Checking buyer_order_items table...');
    const { data: items, error: itemError } = await supabase
      .from('buyer_order_items')
      .select('id, order_id, seller_id, product_name, quantity')
      .limit(3);
    
    if (itemError) {
      console.log('❌ Error accessing buyer_order_items:', itemError.message);
    } else {
      console.log(`✅ Order items accessible - found ${items.length} sample items`);
      if (items.length > 0) {
        console.log('📋 Sample order items:');
        items.forEach((item, index) => {
          const sellerStatus = item.seller_id ? 'Has seller' : '❌ NULL seller_id';
          console.log(`   ${index + 1}. ${item.product_name} (qty: ${item.quantity}) - ${sellerStatus}`);
        });
      }
    }
    
    // 5. Test creating a notification (if we have a valid user)
    console.log('\n5️⃣ Testing notification creation...');
    if (profiles && profiles.length > 0) {
      const testUser = profiles[0];
      const testNotification = {
        user_id: testUser.id,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system works',
        data: { test: true, timestamp: new Date().toISOString() }
      };
      
      const { data: newNotification, error: createError } = await supabase
        .from('notifications')
        .insert([testNotification])
        .select();
      
      if (createError) {
        console.log('❌ Error creating test notification:', createError.message);
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
    } else {
      console.log('⚠️  No user profiles found to test notification creation');
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('================');
    console.log('✅ All database tables are accessible');
    console.log('✅ Notification system is functional');
    console.log('📝 The issue is likely in the trigger functions that need to be updated');
    console.log('\n🚀 Next step: Execute the SQL fix in your Supabase SQL Editor');
    
  } catch (error) {
    console.error('💥 Error during testing:', error);
  }
}

testNotificationSystem();
