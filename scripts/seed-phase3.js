/**
 * Phase 3 Seed Script
 *
 * Seeds demo sellers, items (preloved and barter), and a demo order and barter offer,
 * linking to existing buyer_users and seller_users where possible.
 *
 * Usage: node scripts/seed-phase3.js
 * Requirements: chifere-app/service-account-key.json (Firebase Admin)
 */

import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(readFileSync(path.resolve(__dirname, '../service-account-key.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findAny(collection) {
  const snap = await db.collection(collection).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function pickRandomDocId(collection) {
  const snap = await db.collection(collection).limit(20).get();
  if (snap.empty) return null;
  const docs = snap.docs.map(d => d.id);
  return docs[Math.floor(Math.random() * docs.length)] || docs[0];
}

function ts() {
  return admin.firestore.FieldValue.serverTimestamp();
}

async function seed() {
  console.log('Seeding Phase 3 demo data...');

  // 1) Resolve existing users
  const seller = await findAny('seller_users');
  const buyer = await findAny('buyer_users');

  if (!seller) {
    console.log('No seller_users found. Please create at least one seller_user first.');
    return;
  }
  if (!buyer) {
    console.log('No buyer_users found. Please create at least one buyer_user first.');
    return;
  }

  const sellerId = seller.uid || seller.id;
  const buyerId = buyer.uid || buyer.id;

  // 2) Create two items for seller (preloved + barter)
  const prelovedItem = {
    name: 'Vintage Camera X100',
    description: 'Classic 35mm film camera in excellent condition. Fully functional, recently serviced.',
    category: 'Collectibles',
    condition: 'Excellent',
    location: seller.address || 'Manila',
    price: 4500,
    originalPrice: 7000,
    images: [],
    isBarterOnly: false,
    isSellOnly: true,
    isBoth: false,
    barterPreferences: '',
    tags: ['vintage', 'camera'],
    quantity: 1,
    brand: 'Olympus',
    model: 'OM-1',
    sellerId,
    createdAt: ts(),
    updatedAt: ts(),
    status: 'active',
    views: 0,
    likes: 0,
    rating: 0,
    totalRatings: 0,
    isFeatured: false,
    isVerified: false
  };

  const barterItem = {
    name: 'Gaming Console Bundle',
    description: 'Bundle set with two controllers and 5 games. Looking for camera gear barter.',
    category: 'Toys',
    condition: 'Good',
    location: seller.address || 'Manila',
    price: 0,
    originalPrice: 0,
    images: [],
    isBarterOnly: true,
    isSellOnly: false,
    isBoth: false,
    barterPreferences: 'Vintage cameras, lenses',
    tags: ['console', 'bundle'],
    quantity: 1,
    brand: 'Sony',
    model: 'PS4',
    sellerId,
    createdAt: ts(),
    updatedAt: ts(),
    status: 'active',
    views: 0,
    likes: 0,
    rating: 0,
    totalRatings: 0,
    isFeatured: false,
    isVerified: false
  };

  const prelovedRef = await db.collection('seller_addItemPreloved').add(prelovedItem);
  const barterRef = await db.collection('seller_addBarterItem').add(barterItem);

  console.log('Created items:', prelovedRef.id, barterRef.id);

  // 3) Create a demo order for the preloved item
  const order = {
    buyerId,
    sellerId,
    items: [
      {
        itemId: prelovedRef.id,
        name: prelovedItem.name,
        price: prelovedItem.price,
        quantity: 1,
        image: prelovedItem.images[0] || ''
      }
    ],
    subtotal: prelovedItem.price,
    deliveryFee: 150,
    total: prelovedItem.price + 150,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    paymentId: null,
    deliveryAddress: buyer.address || {},
    courierService: null,
    deliveryStatus: 'pending',
    trackingNumber: null,
    status: 'pending',
    buyerMessage: 'Please deliver in the afternoon.',
    createdAt: ts(),
    updatedAt: ts(),
    confirmedAt: null,
    deliveredAt: null,
    completedAt: null,
    cancelledAt: null
  };

  const orderRef = await db.collection('buyer_orderItem').add(order);
  console.log('Created order:', orderRef.id);

  // 4) Create a demo barter offer targeting the barter item from the buyer
  const barterOffer = {
    requesterId: buyerId,
    ownerId: sellerId,
    originalItemId: barterRef.id,
    originalItem: {
      id: barterRef.id,
      name: barterItem.name,
      image: barterItem.images[0] || ''
    },
    offeredItems: [
      {
        itemId: 'demo-offer-item',
        name: 'DSLR Lens 50mm',
        condition: 'Excellent',
        category: 'Electronics',
        estimatedValue: 3500,
        description: 'Prime lens, sharp optics',
        image: ''
      }
    ],
    status: 'pending',
    currentOfferId: null,
    negotiations: [
      {
        fromUserId: buyerId,
        toUserId: sellerId,
        items: [{ name: 'DSLR Lens 50mm', estimatedValue: 3500 }],
        message: 'Interested in swapping this lens for your console bundle?',
        totalValue: 3500,
        type: 'initial_offer',
        timestamp: new Date().toISOString(),
        status: 'pending'
      }
    ],
    conversationId: null,
    message: 'Let me know if you are interested!',
    deliveryStatus: null,
    deliveryId: null,
    createdAt: ts(),
    updatedAt: ts(),
    acceptedAt: null,
    completedAt: null,
    cancelledAt: null
  };

  const barterOfferRef = await db.collection('buyer_barterOffer').add(barterOffer);
  console.log('Created barter offer:', barterOfferRef.id);

  console.log('\n✓ Seeding complete.');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});


