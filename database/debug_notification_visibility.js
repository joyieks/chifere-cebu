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

async function debugNotificationVisibility() {
  console.log('🔍 Debugging Notification Visibility Issue');
  console.log('==========================================\n');
  
  try {
    // 1. Check all notifications and their user_ids
    console.log('1️⃣ Checking all notifications and their recipients...');
    
    const { data: allNotifications, error: notifError } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        user_id,
        created_at,
        data
      `)
      .order('created_at', { ascending: false });
    
    if (notifError) {
      console.log('❌ Error accessing notifications:', notifError.message);
    } else {
      console.log(`✅ Found ${allNotifications.length} total notifications`);
      
      // Group notifications by user_id
      const notificationsByUser = {};
      allNotifications.forEach(notif => {
        if (!notificationsByUser[notif.user_id]) {
          notificationsByUser[notif.user_id] = [];
        }
        notificationsByUser[notif.user_id].push(notif);
      });
      
      console.log('\n📋 Notifications grouped by user_id:');
      Object.keys(notificationsByUser).forEach(userId => {
        const userNotifs = notificationsByUser[userId];
        console.log(`\n👤 User ID: ${userId}`);
        console.log(`   Notifications: ${userNotifs.length}`);
        userNotifs.forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.type}: ${notif.title} (${new Date(notif.created_at).toLocaleString()})`);
          if (notif.data) {
            console.log(`      Order: ${notif.data.order_number || 'N/A'}`);
            console.log(`      Seller: ${notif.data.seller_name || 'N/A'}`);
            console.log(`      Buyer: ${notif.data.buyer_name || 'N/A'}`);
          }
        });
      });
    }
    
    // 2. Check user profiles to see who are buyers vs sellers
    console.log('\n2️⃣ Checking user profiles...');
    
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, display_name, business_name, user_type')
      .order('user_type');
    
    if (userError) {
      console.log('❌ Error accessing user profiles:', userError.message);
    } else {
      console.log(`✅ Found ${users.length} users`);
      
      const buyers = users.filter(u => u.user_type === 'buyer');
      const sellers = users.filter(u => u.user_type === 'seller');
      
      console.log(`\n👥 Buyers (${buyers.length}):`);
      buyers.forEach((buyer, index) => {
        console.log(`   ${index + 1}. ${buyer.display_name || buyer.business_name} (${buyer.id})`);
      });
      
      console.log(`\n🏪 Sellers (${sellers.length}):`);
      sellers.forEach((seller, index) => {
        console.log(`   ${index + 1}. ${seller.display_name || seller.business_name} (${seller.id})`);
      });
    }
    
    // 3. Check which users are receiving "New Order Received" notifications
    console.log('\n3️⃣ Checking who is receiving "New Order Received" notifications...');
    
    const { data: orderNotifications, error: orderNotifError } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        user_id,
        created_at,
        data
      `)
      .eq('type', 'new_order_received')
      .order('created_at', { ascending: false });
    
    if (orderNotifError) {
      console.log('❌ Error accessing order notifications:', orderNotifError.message);
    } else {
      console.log(`✅ Found ${orderNotifications.length} "New Order Received" notifications`);
      
      // Check if any buyers are receiving these notifications
      const buyerIds = users.filter(u => u.user_type === 'buyer').map(u => u.id);
      const sellerIds = users.filter(u => u.user_type === 'seller').map(u => u.id);
      
      const notificationsToBuyers = orderNotifications.filter(notif => buyerIds.includes(notif.user_id));
      const notificationsToSellers = orderNotifications.filter(notif => sellerIds.includes(notif.user_id));
      
      console.log(`\n❌ PROBLEM: ${notificationsToBuyers.length} notifications sent to BUYERS (this is wrong!)`);
      notificationsToBuyers.forEach(notif => {
        const buyer = users.find(u => u.id === notif.user_id);
        console.log(`   - ${buyer?.display_name || buyer?.business_name} (${notif.user_id})`);
        console.log(`     Order: ${notif.data?.order_number || 'N/A'}`);
        console.log(`     Message: ${notif.message}`);
      });
      
      console.log(`\n✅ CORRECT: ${notificationsToSellers.length} notifications sent to SELLERS`);
      notificationsToSellers.forEach(notif => {
        const seller = users.find(u => u.id === notif.user_id);
        console.log(`   - ${seller?.display_name || seller?.business_name} (${notif.user_id})`);
        console.log(`     Order: ${notif.data?.order_number || 'N/A'}`);
        console.log(`     Message: ${notif.message}`);
      });
    }
    
    // 4. Check recent orders to see the buyer/seller relationships
    console.log('\n4️⃣ Checking recent orders and their buyer/seller relationships...');
    
    const { data: orders, error: orderError } = await supabase
      .from('buyer_orders')
      .select(`
        id,
        order_number,
        buyer_id,
        seller_id,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (orderError) {
      console.log('❌ Error accessing orders:', orderError.message);
    } else {
      console.log(`✅ Found ${orders.length} recent orders`);
      orders.forEach((order, index) => {
        const buyer = users.find(u => u.id === order.buyer_id);
        const seller = users.find(u => u.id === order.seller_id);
        
        console.log(`\n📦 Order ${index + 1}: ${order.order_number}`);
        console.log(`   Buyer: ${buyer?.display_name || buyer?.business_name} (${buyer?.user_type})`);
        console.log(`   Seller: ${seller?.display_name || seller?.business_name} (${seller?.user_type})`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
      });
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log('=================');
    console.log('If notifications are showing in the buyer interface:');
    console.log('1. Check if notifications are being sent to the wrong user_id');
    console.log('2. Check if the frontend is filtering notifications by user type');
    console.log('3. Check if RLS policies are working correctly');
    console.log('4. Check if the notification service is filtering by user');
    
  } catch (error) {
    console.error('💥 Error during debugging:', error);
  }
}

debugNotificationVisibility();
