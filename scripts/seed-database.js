/**
 * Firestore Database Seeding Script
 * 
 * Seeds the database with sample data for testing and development.
 * 
 * Usage: node scripts/seed-database.js
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../service-account-key.json'), 'utf-8')
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'chifere-app.firebasestorage.app'
});

const db = admin.firestore();
const auth = admin.auth();

// Cebu-focused location constants
const CEBU_LOCATION = {
  city: 'Cebu City',
  province: 'Cebu',
  region: 'Central Visayas',
  country: 'Philippines',
  countryCode: 'PH',
  postalCode: '6000',
  coordinates: { lat: 10.3157, lng: 123.8854 }
};

// Sample Data
const SAMPLE_USERS = {
  buyers: [
    {
      email: 'buyer1@test.com',
      password: 'Test@123',
      profile: {
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        displayName: 'Juan Dela Cruz',
        userType: 'buyer',
        phone: '+639171234567',
        address: '123 Osmeña Blvd, Cebu City, Philippines',
        city: CEBU_LOCATION.city,
        province: CEBU_LOCATION.province,
        region: CEBU_LOCATION.region,
        postalCode: CEBU_LOCATION.postalCode,
        profileImage: '',
        isVerified: true
      }
    },
    {
      email: 'buyer2@test.com',
      password: 'Test@123',
      profile: {
        firstName: 'Maria',
        lastName: 'Santos',
        displayName: 'Maria Santos',
        userType: 'buyer',
        phone: '+639181234567',
        address: '456 Colon St, Cebu City, Philippines',
        city: CEBU_LOCATION.city,
        province: CEBU_LOCATION.province,
        region: CEBU_LOCATION.region,
        postalCode: CEBU_LOCATION.postalCode,
        profileImage: '',
        isVerified: true
      }
    }
  ],
  sellers: [
    {
      email: 'seller1@test.com',
      password: 'Test@123',
      profile: {
        firstName: 'Pedro',
        lastName: 'Garcia',
        displayName: 'Pedro Garcia',
        userType: 'seller',
        phone: '+639191234567',
        address: '789 Mango Ave, Cebu City, Philippines',
        city: CEBU_LOCATION.city,
        province: CEBU_LOCATION.province,
        region: CEBU_LOCATION.region,
        postalCode: CEBU_LOCATION.postalCode,
        businessName: "Pedro's Preloved Shop",
        businessDescription: 'Quality preloved items at great prices',
        businessCategory: 'Fashion & Accessories',
        businessAddress: '789 Mango Ave, Cebu City, Philippines',
        businessPhone: '+639191234567',
        businessEmail: 'seller1@test.com',
        profileImage: '',
        isVerified: true,
        isBusinessVerified: true,
        kycStatus: 'approved',
        rating: 4.5,
        totalSales: 0,
        totalItems: 0
      }
    }
  ]
};

const SAMPLE_ITEMS = [
  {
    name: 'Vintage Leather Jacket',
    description: 'Classic brown leather jacket in excellent condition',
    category: 'Fashion',
    price: 1500,
    condition: 'Good',
    images: ['/placeholder-fashion.svg'],
    isBarterOnly: false,
    isSellOnly: true,
    isBoth: false,
    status: 'active',
    views: 0,
    likes: 0,
    rating: 0,
    totalRatings: 0,
    location: {
      ...CEBU_LOCATION,
      address: 'Pedro\'s Preloved Shop, Cebu City'
    }
  },
  {
    name: 'iPhone 12 Pro',
    description: 'Used iPhone 12 Pro, 128GB, all accessories included',
    category: 'Electronics',
    price: 25000,
    condition: 'Excellent',
    images: ['/placeholder-electronic.svg'],
    isBarterOnly: false,
    isSellOnly: true,
    isBoth: false,
    status: 'active',
    views: 0,
    likes: 0,
    rating: 0,
    totalRatings: 0,
    location: {
      ...CEBU_LOCATION,
      address: 'Ayala Center Cebu'
    }
  },
  {
    name: 'Wooden Dining Table',
    description: 'Solid wood dining table for 6 people, willing to barter',
    category: 'Furniture',
    price: 0,
    condition: 'Good',
    images: ['/placeholder-furniture.svg'],
    isBarterOnly: true,
    isSellOnly: false,
    isBoth: false,
    barterPreferences: 'Looking for: sofa, bookshelf, or kitchen appliances',
    status: 'active',
    views: 0,
    likes: 0,
    rating: 0,
    totalRatings: 0,
    location: {
      ...CEBU_LOCATION,
      address: 'IT Park, Lahug, Cebu City'
    }
  }
];

const SAMPLE_NOTIFICATIONS = [
  {
    title: 'Welcome to ChiFere!',
    message: 'Start exploring preloved items and great deals.',
    type: 'system',
    priority: 'normal',
    isRead: false,
    isActionable: false
  },
  {
    title: 'New Order Received',
    message: 'You have a new order for Vintage Leather Jacket',
    type: 'transaction',
    priority: 'high',
    isRead: false,
    isActionable: true,
    actionUrl: '/seller/orders'
  }
];

// Statistics
const stats = {
  users: { created: 0, errors: 0 },
  items: { created: 0, errors: 0 },
  notifications: { created: 0, errors: 0 },
  carts: { created: 0, errors: 0 },
  orders: { created: 0, errors: 0 },
  deliveries: { created: 0, errors: 0 },
  barters: { created: 0, errors: 0 },
  payments: { created: 0, errors: 0 },
  profiles: { created: 0, errors: 0 },
  messages: { created: 0, errors: 0 }
};

/**
 * Create user in Firebase Auth and Firestore
 */
async function createUser(userData, userType) {
  try {
    // Create auth user
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.profile.displayName,
      emailVerified: true
    });

    // Create Firestore document
    const collectionName = userType === 'seller' ? 'seller_users' : 'buyer_users';
    await db.collection(collectionName).doc(userRecord.uid).set({
      ...userData.profile,
      uid: userRecord.uid,
      email: userData.email,
      location: CEBU_LOCATION,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    stats.users.created++;
    console.log(`  ✅ Created ${userType}: ${userData.email}`);
    return userRecord.uid;
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`  ⚪ User already exists: ${userData.email}`);
      // Get existing user
      const userRecord = await auth.getUserByEmail(userData.email);
      return userRecord.uid;
    } else {
      console.error(`  ✗ Error creating user ${userData.email}:`, error.message);
      stats.users.errors++;
      return null;
    }
  }
}

/**
 * Create sample items
 */
async function createItems(sellerId) {
  console.log('\n📦 Creating sample items...');
  
  for (const itemData of SAMPLE_ITEMS) {
    try {
      const collectionName = itemData.isBarterOnly 
        ? 'seller_addBarterItem' 
        : 'seller_addItemPreloved';
      
      await db.collection(collectionName).add({
        ...itemData,
        sellerId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      stats.items.created++;
      console.log(`  ✅ Created item: ${itemData.name}`);
      
    } catch (error) {
      console.error(`  ✗ Error creating item ${itemData.name}:`, error.message);
      stats.items.errors++;
    }
  }
}

/**
 * Create payment methods for a user
 */
async function createPaymentMethods(userId, userType) {
  console.log(`\n💳 Creating payment methods for ${userType}...`);
  try {
    const now = admin.firestore.FieldValue.serverTimestamp();
    if (userType === 'buyer') {
      await db.collection('buyer_paymentMethod').add({
        userId,
        type: 'ewallet',
        ewalletType: 'gcash',
        ewalletAccount: '+639171234567',
        isDefault: true,
        nickname: 'My GCash',
        createdAt: now,
        updatedAt: now
      });
    } else {
      await db.collection('seller_paymentMethod').add({
        userId,
        type: 'bank',
        bankName: 'BPI',
        accountName: 'Pedro Garcia',
        accountNumber: '****1234',
        isDefault: true,
        isVerified: true,
        createdAt: now,
        updatedAt: now
      });
    }
    stats.payments.created++;
  } catch (error) {
    console.error('  ✗ Error creating payment method:', error.message);
    stats.payments.errors++;
  }
}

/**
 * Create a cart for buyer with one item
 */
async function createCartForBuyer(buyerId, item) {
  console.log('\n🛒 Creating buyer cart...');
  try {
    const cartDoc = {
      userId: buyerId,
      items: [
        {
          itemId: item.id || item.itemId || 'temp-item-id',
          name: item.name,
          price: item.price || 0,
          quantity: 1,
          image: item.images?.[0] || '',
          sellerId: item.sellerId,
          addedAt: new Date()
        }
      ],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('buyer_AddToCart').doc(buyerId).set(cartDoc);
    stats.carts.created++;
  } catch (error) {
    console.error('  ✗ Error creating cart:', error.message);
    stats.carts.errors++;
  }
}

/**
 * Create an order between buyer and seller
 */
async function createOrderBetween(buyerId, sellerId, item) {
  console.log('\n🧾 Creating sample order...');
  try {
    const subtotal = item.price || 0;
    const deliveryFee = 120;
    const total = subtotal + deliveryFee;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const order = {
      buyerId,
      sellerId,
      items: [
        {
          itemId: item.id || 'temp-item-id',
          name: item.name,
          price: item.price || 0,
          quantity: 1,
          image: item.images?.[0] || '',
          sellerId
        }
      ],
      subtotal,
      deliveryFee,
      total,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      paymentId: null,
      deliveryAddress: {
        ...CEBU_LOCATION,
        address: 'Buyer address, Cebu City'
      },
      courierService: 'Lalamove',
      deliveryStatus: 'pending',
      trackingNumber: null,
      status: 'pending',
      buyerMessage: 'Please handle with care.',
      createdAt: now,
      updatedAt: now,
      confirmedAt: null,
      deliveredAt: null,
      completedAt: null,
      cancelledAt: null
    };

    const orderRef = await db.collection('buyer_orderItem').add(order);
    stats.orders.created++;
    return orderRef.id;
  } catch (error) {
    console.error('  ✗ Error creating order:', error.message);
    stats.orders.errors++;
    return null;
  }
}

/**
 * Create delivery record for an order
 */
async function createDeliveryForOrder(orderId, buyerId, sellerId) {
  console.log('\n🚚 Creating delivery record...');
  try {
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('Delivery').add({
      orderId,
      buyerId,
      sellerId,
      courierService: 'Lalamove',
      trackingNumber: 'LLM-' + Math.floor(Math.random()*1000000),
      status: 'pending',
      estimatedDelivery: now,
      updates: [
        {
          status: 'pending',
          location: 'Cebu Warehouse',
          timestamp: new Date(),
          note: 'Order created'
        }
      ],
      createdAt: now,
      updatedAt: now
    });
    stats.deliveries.created++;
  } catch (error) {
    console.error('  ✗ Error creating delivery:', error.message);
    stats.deliveries.errors++;
  }
}

/**
 * Create buyer and seller profiles (extended)
 */
async function createProfiles(buyerId, sellerId) {
  console.log('\n📇 Creating extended profiles...');
  const now = admin.firestore.FieldValue.serverTimestamp();
  try {
    await db.collection('buyer_profile').doc(buyerId).set({
      uid: buyerId,
      preferences: { categories: ['Fashion', 'Electronics'] },
      location: CEBU_LOCATION,
      createdAt: now,
      updatedAt: now
    });
    await db.collection('seller_profile').doc(sellerId).set({
      uid: sellerId,
      storeDescription: 'Cebu-based preloved items',
      location: CEBU_LOCATION,
      createdAt: now,
      updatedAt: now
    });
    stats.profiles.created += 2;
  } catch (error) {
    console.error('  ✗ Error creating profiles:', error.message);
    stats.profiles.errors++;
  }
}

/**
 * Create a barter offer
 */
async function createBarterOffer(buyerId, sellerId, barterItem) {
  console.log('\n🔄 Creating barter offer...');
  try {
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('buyer_barterOffer').add({
      requesterId: buyerId,
      ownerId: sellerId,
      requestedItemId: barterItem.id || 'barter-item-id',
      offeredItemId: null,
      requestedItem: { name: barterItem.name, image: barterItem.images?.[0] || '' },
      offeredItem: { name: 'Old Guitar', image: '' },
      additionalCash: 500,
      message: 'Would you trade this for my old guitar + 500?',
      status: 'pending',
      createdAt: now,
      updatedAt: now
    });
    stats.barters.created++;
  } catch (error) {
    console.error('  ✗ Error creating barter offer:', error.message);
    stats.barters.errors++;
  }
}

/**
 * Create sample notifications
 */
async function createNotifications(userId) {
  console.log('\n🔔 Creating sample notifications...');
  
  for (const notifData of SAMPLE_NOTIFICATIONS) {
    try {
      await db.collection('Notifications').add({
        ...notifData,
        userId,
        data: {},
        expiresAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      stats.notifications.created++;
      console.log(`  ✅ Created notification: ${notifData.title}`);
      
    } catch (error) {
      console.error(`  ✗ Error creating notification:`, error.message);
      stats.notifications.errors++;
    }
  }
}

/**
 * Create a sample message
 */
async function createMessage(conversationId, senderId, receiverId) {
  console.log('\n💬 Creating sample message...');
  try {
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('messages').add({
      conversationId: conversationId || 'conv-1',
      senderId,
      receiverId,
      content: 'Hello from Cebu! Interested in your item.',
      type: 'text',
      metadata: { city: CEBU_LOCATION.city },
      isRead: false,
      isEdited: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    });
    stats.messages.created++;
  } catch (error) {
    console.error('  ✗ Error creating message:', error.message);
    stats.messages.errors++;
  }
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  console.log('🌱 ChiFere Database Seeding');
  console.log('='.repeat(60));
  console.log('This will create sample data for testing.\n');

  // Create buyers
  console.log('👥 Creating buyer users...');
  const buyerIds = [];
  for (const buyer of SAMPLE_USERS.buyers) {
    const uid = await createUser(buyer, 'buyer');
    if (uid) buyerIds.push(uid);
  }

  // Create sellers
  console.log('\n👥 Creating seller users...');
  const sellerIds = [];
  for (const seller of SAMPLE_USERS.sellers) {
    const uid = await createUser(seller, 'seller');
    if (uid) sellerIds.push(uid);
  }

  // Create items for first seller
  let firstPrelovedItem = null;
  let firstBarterItem = null;
  if (sellerIds.length > 0) {
    // Actually add and capture references by re-adding two known items
    await createItems(sellerIds[0]);
    // Fetch one preloved and one barter item to reference elsewhere
    const prelovedSnap = await db.collection('seller_addItemPreloved').limit(1).get();
    const barterSnap = await db.collection('seller_addBarterItem').limit(1).get();
    if (!prelovedSnap.empty) {
      firstPrelovedItem = { id: prelovedSnap.docs[0].id, ...prelovedSnap.docs[0].data() };
    }
    if (!barterSnap.empty) {
      firstBarterItem = { id: barterSnap.docs[0].id, ...barterSnap.docs[0].data() };
    }
  }

  // Create notifications for first buyer
  if (buyerIds.length > 0) {
    await createNotifications(buyerIds[0]);
    await createPaymentMethods(buyerIds[0], 'buyer');
  }

  // Create payment method for first seller
  if (sellerIds.length > 0) {
    await createPaymentMethods(sellerIds[0], 'seller');
  }

  // Create cart for first buyer with first preloved item
  if (buyerIds.length > 0 && firstPrelovedItem) {
    await createCartForBuyer(buyerIds[0], firstPrelovedItem);
  }

  // Create order and delivery between first buyer and first seller
  let orderId = null;
  if (buyerIds.length > 0 && sellerIds.length > 0 && firstPrelovedItem) {
    orderId = await createOrderBetween(buyerIds[0], sellerIds[0], firstPrelovedItem);
    if (orderId) {
      await createDeliveryForOrder(orderId, buyerIds[0], sellerIds[0]);
    }
  }

  // Create a barter offer for the barter item
  if (buyerIds.length > 0 && sellerIds.length > 0 && firstBarterItem) {
    await createBarterOffer(buyerIds[0], sellerIds[0], firstBarterItem);
  }

  // Create extended profiles
  if (buyerIds.length > 0 && sellerIds.length > 0) {
    await createProfiles(buyerIds[0], sellerIds[0]);
  }

  // Create messages between buyer and seller
  if (buyerIds.length > 0 && sellerIds.length > 0) {
    await createMessage('conv-cebu-1', buyerIds[0], sellerIds[0]);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Users created: ${stats.users.created} (${stats.users.errors} errors)`);
  console.log(`Items created: ${stats.items.created} (${stats.items.errors} errors)`);
  console.log(`Notifications created: ${stats.notifications.created} (${stats.notifications.errors} errors)`);
  console.log(`Carts created: ${stats.carts.created} (${stats.carts.errors} errors)`);
  console.log(`Orders created: ${stats.orders.created} (${stats.orders.errors} errors)`);
  console.log(`Deliveries created: ${stats.deliveries.created} (${stats.deliveries.errors} errors)`);
  console.log(`Barter offers created: ${stats.barters.created} (${stats.barters.errors} errors)`);
  console.log(`Payment methods created: ${stats.payments.created} (${stats.payments.errors} errors)`);
  console.log(`Profiles created: ${stats.profiles.created} (${stats.profiles.errors} errors)`);
  console.log(`Messages created: ${stats.messages.created} (${stats.messages.errors} errors)`);
  
  console.log('\n📋 Test Accounts:');
  console.log('  Buyers:');
  SAMPLE_USERS.buyers.forEach(b => {
    console.log(`    - ${b.email} / ${b.password}`);
  });
  console.log('  Sellers:');
  SAMPLE_USERS.sellers.forEach(s => {
    console.log(`    - ${s.email} / ${s.password}`);
  });
  
  console.log('\n✅ Database seeding complete!\n');
  
  process.exit(0);
}

// Run seeding
seedDatabase().catch(error => {
  console.error('\n✗ Seeding failed:', error);
  process.exit(1);
});

