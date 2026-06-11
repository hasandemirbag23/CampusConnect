import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';

import { COLLECTIONS, SUBCOLLECTIONS } from '../constants/FIREBASE_KEYS';
import { FLAT_LIST } from '../constants/SPACING';
import { db } from './firebase';

const listingsRef = collection(db, COLLECTIONS.LISTINGS);
const PAGE_SIZE = FLAT_LIST.PAGE_SIZE;

function applyClientFilters(listings, filters = {}) {
  let result = listings;
  if (filters.minPrice != null) result = result.filter((l) => l.price >= filters.minPrice);
  if (filters.maxPrice != null) result = result.filter((l) => l.price <= filters.maxPrice);
  return result;
}

function buildListingsQuery(filters = {}, pageSize = PAGE_SIZE, lastDoc = null) {
  const constraints = [orderBy('createdAt', 'desc')];
  if (filters.category) constraints.unshift(where('category', '==', filters.category));
  if (filters.status) constraints.unshift(where('status', '==', filters.status));
  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));
  return query(listingsRef, ...constraints);
}

export function subscribeToListings(callback, filters = {}, pageSize = PAGE_SIZE) {
  const q = buildListingsQuery(filters, pageSize);
  return onSnapshot(
    q,
    (snapshot) => {
      const listings = applyClientFilters(
        snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        filters,
      );
      callback({
        listings,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize,
      });
    },
    (error) => {
      console.error('[Firestore] listings:', error.message);
      callback({ listings: [], lastDoc: null, hasMore: false });
    },
  );
}

export async function fetchListingsPage(lastDoc = null, filters = {}) {
  const q = buildListingsQuery(filters, PAGE_SIZE, lastDoc);
  const snapshot = await getDocs(q);
  const listings = applyClientFilters(
    snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    filters,
  );
  return {
    listings,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export function subscribeToListing(listingId, callback) {
  return onSnapshot(doc(db, COLLECTIONS.LISTINGS, listingId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export function subscribeToMyListings(sellerId, callback) {
  if (!sellerId) {
    callback([]);
    return () => {};
  }
  const q = query(listingsRef, where('sellerId', '==', sellerId));
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    () => callback([]),
  );
}

export async function fetchMyListings(sellerId) {
  const q = query(listingsRef, where('sellerId', '==', sellerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function createListing(data, seller) {
  const docRef = await addDoc(listingsRef, {
    ...data,
    sellerId: seller.uid,
    seller: {
      displayName: seller.displayName || '',
      photoURL: seller.photoURL || '',
      department: seller.department || '',
    },
    viewCount: 0,
    savedCount: 0,
    status: 'active',
    currency: 'TRY',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateListing(listingId, data) {
  await updateDoc(doc(db, COLLECTIONS.LISTINGS, listingId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteListing(listingId) {
  await deleteDoc(doc(db, COLLECTIONS.LISTINGS, listingId));
}

export async function markAsSold(listingId) {
  await updateDoc(doc(db, COLLECTIONS.LISTINGS, listingId), {
    status: 'sold',
    updatedAt: serverTimestamp(),
  });
}

export async function saveListing(userId, listingId) {
  await setDoc(doc(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.SAVED_LISTINGS, listingId), {
    savedAt: serverTimestamp(),
  });
}

export async function unsaveListing(userId, listingId) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.SAVED_LISTINGS, listingId));
}

export function subscribeToSavedListings(userId, callback) {
  return onSnapshot(
    collection(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.SAVED_LISTINGS),
    async (snapshot) => {
      const items = await Promise.all(snapshot.docs.map((d) => getListing(d.id)));
      callback(items.filter(Boolean));
    },
    () => callback([]),
  );
}

export async function getListing(listingId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.LISTINGS, listingId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function fetchSimilarListings(category, excludeId) {
  const q = query(listingsRef, where('category', '==', category), where('status', '==', 'active'), limit(10));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((l) => l.id !== excludeId)
    .slice(0, 4);
}
