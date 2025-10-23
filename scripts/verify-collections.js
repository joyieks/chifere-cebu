/**
 * Verify Firestore Collections
 * 
 * Checks which collections exist in Firestore and their document counts.
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

// Expected collections from requirements
const expectedCollections = [
  'buyer_users',
  'seller_users',
  'buyer_AddToCart',
  'buyer_orderItem',
  'seller_addItemPreloved',
  'seller_addBarterItem',
  'buyer_barterOffer',
  'seller_paymentMethod',
  'buyer_paymentMethod',
  'Notifications',
  'Delivery',
  'buyer_profile',
  'seller_profile',
  'messages'
];

// Old collections to identify
const oldCollections = [
  'users',
  'orders',
  'notifications',
  'carts',
  'items',
  'barters',
  'deliveries'
];

async function verifyCollections() {
  console.log('🔍 Checking Firestore Collections...\n');
  
  const found = [];
  const missing = [];
  const oldFound = [];
  
  // Check expected collections
  console.log('📋 EXPECTED COLLECTIONS:');
  console.log('='.repeat(60));
  
  for (const collectionName of expectedCollections) {
    try {
      const snapshot = await db.collection(collectionName).limit(1).get();
      const count = await db.collection(collectionName).count().get();
      const totalDocs = count.data().count;
      
      if (snapshot.size > 0 || totalDocs > 0) {
        console.log(`✅ ${collectionName.padEnd(30)} - ${totalDocs} documents`);
        found.push({ name: collectionName, count: totalDocs });
      } else {
        console.log(`⚪ ${collectionName.padEnd(30)} - EXISTS (empty)`);
        found.push({ name: collectionName, count: 0 });
      }
    } catch (error) {
      console.log(`❌ ${collectionName.padEnd(30)} - MISSING`);
      missing.push(collectionName);
    }
  }
  
  // Check for old collections
  console.log('\n🔍 OLD COLLECTIONS (Should be removed):');
  console.log('='.repeat(60));
  
  for (const collectionName of oldCollections) {
    try {
      const count = await db.collection(collectionName).count().get();
      const totalDocs = count.data().count;
      
      if (totalDocs > 0) {
        console.log(`⚠️  ${collectionName.padEnd(30)} - ${totalDocs} documents (OLD)`);
        oldFound.push({ name: collectionName, count: totalDocs });
      }
    } catch (error) {
      // Collection doesn't exist, which is good
    }
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Expected collections found: ${found.length}/${expectedCollections.length}`);
  console.log(`Missing collections: ${missing.length}`);
  console.log(`Old collections to remove: ${oldFound.length}`);
  
  if (oldFound.length > 0) {
    console.log('\n⚠️  WARNING: Old collections found:');
    oldFound.forEach(col => {
      console.log(`   - ${col.name} (${col.count} documents)`);
    });
    console.log('\nRun delete-old-collections.js to remove them.');
  }
  
  if (missing.length > 0) {
    console.log('\n❓ Missing collections:');
    missing.forEach(col => {
      console.log(`   - ${col}`);
    });
  }
  
  process.exit(0);
}

verifyCollections().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

