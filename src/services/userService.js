import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { COLLECTIONS, SUBCOLLECTIONS } from '../constants/FIREBASE_KEYS';
import { db } from './firebase';

export function subscribeToNotifications(userId, callback) {
  const q = query(
    collection(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.NOTIFICATIONS),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, () => callback([]));
}

export async function followUser(userId, targetId) {
  await setDoc(doc(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.FOLLOWS, targetId), {
    followedAt: serverTimestamp(),
  });
}

export async function unfollowUser(userId, targetId) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.FOLLOWS, targetId));
}

export async function isFollowing(userId, targetId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.FOLLOWS, targetId));
  return snapshot.exists();
}

export async function getUserProfile(userId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export function subscribeToUserProfile(userId, callback) {
  if (!userId) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, COLLECTIONS.USERS, userId),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    () => callback(null),
  );
}

export async function markNotificationRead(userId, notifId) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.NOTIFICATIONS, notifId), {
    read: true,
  });
}

export async function deleteNotification(userId, notifId) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.NOTIFICATIONS, notifId));
}
