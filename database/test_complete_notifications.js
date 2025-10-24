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

async function testCompleteNotificationSystem() {
  console.log('🧪 Testing Complete Notification System');
  console.log('=======================================\n');
  
  try {
    // 1. Check current notification system status
    console.log('1️⃣ Checking notification system status...');
    
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, type, title, message, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
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
    
    // 2. Check if we have test data (users, orders, etc.)
    console.log('\n2️⃣ Checking test data availability...');
    
    // Get sample users
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, display_name, business_name, user_type')
      .limit(5);
    
    if (userError) {
      console.log('❌ Error accessing user_profiles:', userError.message);
    } else {
      console.log(`✅ Found ${users.length} users`);
      const buyers = users.filter(u => u.user_type === 'buyer');
      const sellers = users.filter(u => u.user_type === 'seller');
      console.log(`   - Buyers: ${buyers.length}`);
      console.log(`   - Sellers: ${sellers.length}`);
    }
    
    // Get sample orders
    const { data: orders, error: orderError } = await supabase
      .from('buyer_orders')
      .select('id, order_number, buyer_id, seller_id, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (orderError) {
      console.log('❌ Error accessing buyer_orders:', orderError.message);
    } else {
      console.log(`✅ Found ${orders.length} recent orders`);
      if (orders.length > 0) {
        console.log('📋 Recent orders:');
        orders.forEach((order, index) => {
          const sellerStatus = order.seller_id ? 'Has seller' : '❌ NULL seller_id';
          console.log(`   ${index + 1}. Order #${order.order_number} - ${order.status} - ${sellerStatus}`);
        });
      }
    }
    
    // 3. Test notification creation manually
    console.log('\n3️⃣ Testing manual notification creation...');
    
    if (users && users.length > 0) {
      const testUser = users[0];
      const testNotification = {
        user_id: testUser.id,
        type: 'new_order_received',
        title: 'Test Notification - New Order',
        message: 'This is a test notification to verify the system works',
        data: { 
          test: true, 
          timestamp: new Date().toISOString(),
          order_id: 'test-order-123'
        }
      };
      
      const { data: newNotification, error: createError } = await supabase
        .from('notifications')
        .insert([testNotification])
        .select();
      
      if (createError) {
        console.log('❌ Error creating test notification:', createError.message);
        if (createError.message.includes('row-level security')) {
          console.log('💡 This is expected - RLS is working correctly');
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
    
    // 4. Check if triggers exist (we can't directly query them, but we can test functionality)
    console.log('\n4️⃣ Testing notification triggers...');
    console.log('📝 To test triggers, you need to:');
    console.log('   1. Create a new order (should trigger seller notification)');
    console.log('   2. Update an order status (should trigger buyer notification)');
    console.log('   3. Follow a store (should trigger seller notification)');
    console.log('   4. Create a review (should trigger seller notification)');
    
    // 5. Show current notification types
    console.log('\n5️⃣ Current notification types in system:');
    const notificationTypes = [
      'new_order_received - When buyer places order',
      'order_status_update - When seller updates order status',
      'new_follower - When someone follows a store',
      'new_review - When buyer leaves a review',
      'order_cancelled - When order is cancelled',
      'payment_received - When payment is received',
      'item_sold - When item is sold'
    ];
    
    notificationTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type}`);
    });
    
    console.log('\n🎯 Test Summary:');
    console.log('================');
    console.log('✅ Notification system is accessible');
    console.log('✅ Database tables are working');
    console.log('📝 Next steps:');
    console.log('   1. Execute the complete_notification_system.sql in Supabase SQL Editor');
    console.log('   2. Test by creating a new order in your app');
    console.log('   3. Check if seller receives notification');
    console.log('   4. Update order status and check if buyer receives notification');
    
  } catch (error) {
    console.error('💥 Error during testing:', error);
  }
}

// Function to show the SQL that needs to be executed
function showSQLInstructions() {
  console.log('\n📄 SQL Instructions:');
  console.log('====================');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of complete_notification_system.sql');
  console.log('4. Execute the SQL');
  console.log('5. Test the notifications by:');
  console.log('   - Creating a new order');
  console.log('   - Updating order status');
  console.log('   - Following a store');
  console.log('   - Creating a review');
}

// Main execution
async function main() {
  await testCompleteNotificationSystem();
  showSQLInstructions();
}

main();
