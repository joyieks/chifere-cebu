/**
 * Firestore Collection Migration Script
 * 
 * Migrates data from old collection structure to new naming schema:
 * - users → buyer_users / seller_users
 * - carts → buyer_AddToCart
 * - orders → buyer_orderItem
 * - items → seller_addItemPreloved / seller_addBarterItem
 * - barters → buyer_barterOffer
 * - deliveries → Delivery
 * - notifications → Notifications
 * 
 * Usage: node scripts/migrate-collections.js
 * 
 * IMPORTANT: Create database backup before running!
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
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configuration
const DRY_RUN = true; // Set to false to actually perform migration
const BATCH_SIZE = 500; // Firestore batch limit

// Migration statistics
const stats = {
  users: { total: 0, buyers: 0, sellers: 0, errors: 0 },
  carts: { total: 0, migrated: 0, errors: 0 },
  orders: { total: 0, migrated: 0, errors: 0 },
  items: { total: 0, preloved: 0, barter: 0, errors: 0 },
  barters: { total: 0, migrated: 0, errors: 0 },
  deliveries: { total: 0, migrated: 0, errors: 0 },
  notifications: { total: 0, migrated: 0, errors: 0 }
};

/**
 * Migrate users collection to split buyer_users and seller_users
 */
async function migrateUsers() {
  console.log('\n📋 Migrating users...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    stats.users.total = usersSnapshot.size;
    console.log(`Found ${stats.users.total} users`);

    const buyerBatch = db.batch();
    const sellerBatch = db.batch();
    let buyerCount = 0;
    let sellerCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userType = userData.userType || 'buyer';
      
      try {
        if (userType === 'seller') {
          const sellerRef = db.collection('seller_users').doc(userDoc.id);
          if (!DRY_RUN) {
            sellerBatch.set(sellerRef, userData);
          }
          sellerCount++;
          stats.users.sellers++;
        } else {
          const buyerRef = db.collection('buyer_users').doc(userDoc.id);
          if (!DRY_RUN) {
            buyerBatch.set(buyerRef, userData);
          }
          buyerCount++;
          stats.users.buyers++;
        }

        // Commit batch if reaching limit
        if (buyerCount >= BATCH_SIZE) {
          if (!DRY_RUN) await buyerBatch.commit();
          console.log(`  ✓ Migrated ${buyerCount} buyers`);
          buyerCount = 0;
        }
        
        if (sellerCount >= BATCH_SIZE) {
          if (!DRY_RUN) await sellerBatch.commit();
          console.log(`  ✓ Migrated ${sellerCount} sellers`);
          sellerCount = 0;
        }
      } catch (error) {
        console.error(`  ✗ Error migrating user ${userDoc.id}:`, error.message);
        stats.users.errors++;
      }
    }

    // Commit remaining
    if (!DRY_RUN) {
      if (buyerCount > 0) await buyerBatch.commit();
      if (sellerCount > 0) await sellerBatch.commit();
    }

    console.log(`✓ Users migration complete: ${stats.users.buyers} buyers, ${stats.users.sellers} sellers`);
  } catch (error) {
    console.error('✗ Error migrating users:', error);
  }
}

/**
 * Migrate carts to buyer_AddToCart
 */
async function migrateCarts() {
  console.log('\n🛒 Migrating carts...');
  
  try {
    const cartsSnapshot = await db.collection('carts').get();
    stats.carts.total = cartsSnapshot.size;
    console.log(`Found ${stats.carts.total} carts`);

    const batch = db.batch();
    let count = 0;

    for (const cartDoc of cartsSnapshot.docs) {
      try {
        const newRef = db.collection('buyer_AddToCart').doc(cartDoc.id);
        if (!DRY_RUN) {
          batch.set(newRef, cartDoc.data());
        }
        count++;
        stats.carts.migrated++;

        if (count >= BATCH_SIZE) {
          if (!DRY_RUN) await batch.commit();
          console.log(`  ✓ Migrated ${count} carts`);
          count = 0;
        }
      } catch (error) {
        console.error(`  ✗ Error migrating cart ${cartDoc.id}:`, error.message);
        stats.carts.errors++;
      }
    }

    if (!DRY_RUN && count > 0) {
      await batch.commit();
    }

    console.log(`✓ Carts migration complete: ${stats.carts.migrated} migrated`);
  } catch (error) {
    console.error('✗ Error migrating carts:', error);
  }
}

/**
 * Migrate orders to buyer_orderItem
 */
async function migrateOrders() {
  console.log('\n📦 Migrating orders...');
  
  try {
    const ordersSnapshot = await db.collection('orders').get();
    stats.orders.total = ordersSnapshot.size;
    console.log(`Found ${stats.orders.total} orders`);

    const batch = db.batch();
    let count = 0;

    for (const orderDoc of ordersSnapshot.docs) {
      try {
        const newRef = db.collection('buyer_orderItem').doc(orderDoc.id);
        if (!DRY_RUN) {
          batch.set(newRef, orderDoc.data());
        }
        count++;
        stats.orders.migrated++;

        if (count >= BATCH_SIZE) {
          if (!DRY_RUN) await batch.commit();
          console.log(`  ✓ Migrated ${count} orders`);
          count = 0;
        }
      } catch (error) {
        console.error(`  ✗ Error migrating order ${orderDoc.id}:`, error.message);
        stats.orders.errors++;
      }
    }

    if (!DRY_RUN && count > 0) {
      await batch.commit();
    }

    console.log(`✓ Orders migration complete: ${stats.orders.migrated} migrated`);
  } catch (error) {
    console.error('✗ Error migrating orders:', error);
  }
}

/**
 * Migrate items to seller_addItemPreloved / seller_addBarterItem
 */
async function migrateItems() {
  console.log('\n🏷️  Migrating items...');
  
  try {
    const itemsSnapshot = await db.collection('items').get();
    stats.items.total = itemsSnapshot.size;
    console.log(`Found ${stats.items.total} items`);

    const prelovedBatch = db.batch();
    const barterBatch = db.batch();
    let prelovedCount = 0;
    let barterCount = 0;

    for (const itemDoc of itemsSnapshot.docs) {
      const itemData = itemDoc.data();
      const isBarterOnly = itemData.isBarterOnly || false;
      
      try {
        if (isBarterOnly) {
          const barterRef = db.collection('seller_addBarterItem').doc(itemDoc.id);
          if (!DRY_RUN) {
            barterBatch.set(barterRef, itemData);
          }
          barterCount++;
          stats.items.barter++;
        } else {
          const prelovedRef = db.collection('seller_addItemPreloved').doc(itemDoc.id);
          if (!DRY_RUN) {
            prelovedBatch.set(prelovedRef, itemData);
          }
          prelovedCount++;
          stats.items.preloved++;
        }

        if (prelovedCount >= BATCH_SIZE) {
          if (!DRY_RUN) await prelovedBatch.commit();
          console.log(`  ✓ Migrated ${prelovedCount} preloved items`);
          prelovedCount = 0;
        }
        
        if (barterCount >= BATCH_SIZE) {
          if (!DRY_RUN) await barterBatch.commit();
          console.log(`  ✓ Migrated ${barterCount} barter items`);
          barterCount = 0;
        }
      } catch (error) {
        console.error(`  ✗ Error migrating item ${itemDoc.id}:`, error.message);
        stats.items.errors++;
      }
    }

    if (!DRY_RUN) {
      if (prelovedCount > 0) await prelovedBatch.commit();
      if (barterCount > 0) await barterBatch.commit();
    }

    console.log(`✓ Items migration complete: ${stats.items.preloved} preloved, ${stats.items.barter} barter`);
  } catch (error) {
    console.error('✗ Error migrating items:', error);
  }
}

/**
 * Migrate barters to buyer_barterOffer
 */
async function migrateBarters() {
  console.log('\n🔄 Migrating barters...');
  
  try {
    const bartersSnapshot = await db.collection('barters').get();
    stats.barters.total = bartersSnapshot.size;
    console.log(`Found ${stats.barters.total} barters`);

    const batch = db.batch();
    let count = 0;

    for (const barterDoc of bartersSnapshot.docs) {
      try {
        const newRef = db.collection('buyer_barterOffer').doc(barterDoc.id);
        if (!DRY_RUN) {
          batch.set(newRef, barterDoc.data());
        }
        count++;
        stats.barters.migrated++;

        if (count >= BATCH_SIZE) {
          if (!DRY_RUN) await batch.commit();
          console.log(`  ✓ Migrated ${count} barters`);
          count = 0;
        }
      } catch (error) {
        console.error(`  ✗ Error migrating barter ${barterDoc.id}:`, error.message);
        stats.barters.errors++;
      }
    }

    if (!DRY_RUN && count > 0) {
      await batch.commit();
    }

    console.log(`✓ Barters migration complete: ${stats.barters.migrated} migrated`);
  } catch (error) {
    console.error('✗ Error migrating barters:', error);
  }
}

/**
 * Migrate deliveries to Delivery
 */
async function migrateDeliveries() {
  console.log('\n🚚 Migrating deliveries...');
  
  try {
    const deliveriesSnapshot = await db.collection('deliveries').get();
    stats.deliveries.total = deliveriesSnapshot.size;
    console.log(`Found ${stats.deliveries.total} deliveries`);

    const batch = db.batch();
    let count = 0;

    for (const deliveryDoc of deliveriesSnapshot.docs) {
      try {
        const newRef = db.collection('Delivery').doc(deliveryDoc.id);
        if (!DRY_RUN) {
          batch.set(newRef, deliveryDoc.data());
        }
        count++;
        stats.deliveries.migrated++;

        if (count >= BATCH_SIZE) {
          if (!DRY_RUN) await batch.commit();
          console.log(`  ✓ Migrated ${count} deliveries`);
          count = 0;
        }
      } catch (error) {
        console.error(`  ✗ Error migrating delivery ${deliveryDoc.id}:`, error.message);
        stats.deliveries.errors++;
      }
    }

    if (!DRY_RUN && count > 0) {
      await batch.commit();
    }

    console.log(`✓ Deliveries migration complete: ${stats.deliveries.migrated} migrated`);
  } catch (error) {
    console.error('✗ Error migrating deliveries:', error);
  }
}

/**
 * Migrate notifications to Notifications
 */
async function migrateNotifications() {
  console.log('\n🔔 Migrating notifications...');
  
  try {
    const notificationsSnapshot = await db.collection('notifications').get();
    stats.notifications.total = notificationsSnapshot.size;
    console.log(`Found ${stats.notifications.total} notifications`);

    const batch = db.batch();
    let count = 0;

    for (const notificationDoc of notificationsSnapshot.docs) {
      try {
        const newRef = db.collection('Notifications').doc(notificationDoc.id);
        if (!DRY_RUN) {
          batch.set(newRef, notificationDoc.data());
        }
        count++;
        stats.notifications.migrated++;

        if (count >= BATCH_SIZE) {
          if (!DRY_RUN) await batch.commit();
          console.log(`  ✓ Migrated ${count} notifications`);
          count = 0;
        }
      } catch (error) {
        console.error(`  ✗ Error migrating notification ${notificationDoc.id}:`, error.message);
        stats.notifications.errors++;
      }
    }

    if (!DRY_RUN && count > 0) {
      await batch.commit();
    }

    console.log(`✓ Notifications migration complete: ${stats.notifications.migrated} migrated`);
  } catch (error) {
    console.error('✗ Error migrating notifications:', error);
  }
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes made)' : 'LIVE (changes applied)'}`);
  console.log('');
  console.log('Users:');
  console.log(`  Total: ${stats.users.total}`);
  console.log(`  Buyers: ${stats.users.buyers}`);
  console.log(`  Sellers: ${stats.users.sellers}`);
  console.log(`  Errors: ${stats.users.errors}`);
  console.log('');
  console.log(`Carts: ${stats.carts.migrated}/${stats.carts.total} (${stats.carts.errors} errors)`);
  console.log(`Orders: ${stats.orders.migrated}/${stats.orders.total} (${stats.orders.errors} errors)`);
  console.log('');
  console.log('Items:');
  console.log(`  Total: ${stats.items.total}`);
  console.log(`  Preloved: ${stats.items.preloved}`);
  console.log(`  Barter: ${stats.items.barter}`);
  console.log(`  Errors: ${stats.items.errors}`);
  console.log('');
  console.log(`Barters: ${stats.barters.migrated}/${stats.barters.total} (${stats.barters.errors} errors)`);
  console.log(`Deliveries: ${stats.deliveries.migrated}/${stats.deliveries.total} (${stats.deliveries.errors} errors)`);
  console.log(`Notifications: ${stats.notifications.migrated}/${stats.notifications.total} (${stats.notifications.errors} errors)`);
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN - no actual changes were made.');
    console.log('Set DRY_RUN = false to perform actual migration.');
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 ChiFere Database Migration');
  console.log('==============================');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');
  
  if (!DRY_RUN) {
    console.log('⚠️  WARNING: This will modify your database!');
    console.log('⚠️  Make sure you have a backup before proceeding.');
    console.log('');
  }

  try {
    await migrateUsers();
    await migrateCarts();
    await migrateOrders();
    await migrateItems();
    await migrateBarters();
    await migrateDeliveries();
    await migrateNotifications();
    
    printSummary();
    
    console.log('\n✓ Migration complete!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run migration
main();


