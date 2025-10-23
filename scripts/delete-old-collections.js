/**
 * Delete Old Firestore Collections
 * 
 * Removes old collections after successful migration:
 * - users
 * - orders
 * - notifications
 * - carts
 * - items
 * - barters
 * - deliveries
 * 
 * IMPORTANT: Make sure migration is successful before running!
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

// Old collections to delete
const OLD_COLLECTIONS = [
  'users',
  'orders',
  'notifications',
  'carts',
  'items',
  'barters',
  'deliveries'
];

const BATCH_SIZE = 500;

/**
 * Delete all documents in a collection
 */
async function deleteCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.limit(BATCH_SIZE);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // Done deleting all documents
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick to avoid
  // exploding the stack
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function main() {
  console.log('🗑️  ChiFere Old Collections Cleanup');
  console.log('='.repeat(60));
  console.log('⚠️  WARNING: This will DELETE old collections!');
  console.log('⚠️  Make sure new collections have all your data.\n');

  const stats = {
    deleted: 0,
    errors: 0,
    collections: []
  };

  for (const collectionName of OLD_COLLECTIONS) {
    try {
      console.log(`\n🗑️  Deleting collection: ${collectionName}...`);
      
      // Check if collection has documents
      const count = await db.collection(collectionName).count().get();
      const totalDocs = count.data().count;
      
      if (totalDocs === 0) {
        console.log(`  ⚪ Collection is already empty`);
        continue;
      }
      
      console.log(`  📊 Found ${totalDocs} documents`);
      await deleteCollection(collectionName);
      
      console.log(`  ✅ Deleted ${totalDocs} documents from ${collectionName}`);
      stats.deleted += totalDocs;
      stats.collections.push(collectionName);
      
    } catch (error) {
      console.error(`  ✗ Error deleting ${collectionName}:`, error.message);
      stats.errors++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total documents deleted: ${stats.deleted}`);
  console.log(`Collections cleaned: ${stats.collections.length}`);
  console.log(`Errors: ${stats.errors}`);
  
  if (stats.collections.length > 0) {
    console.log('\nCollections deleted:');
    stats.collections.forEach(col => console.log(`  - ${col}`));
  }
  
  console.log('\n✅ Old collections cleanup complete!');
  console.log('Your Firestore now uses only the new collection schema.\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('\n✗ Cleanup failed:', error);
  process.exit(1);
});

