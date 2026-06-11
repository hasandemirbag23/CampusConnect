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
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { COLLECTIONS, SUBCOLLECTIONS } from '../constants/FIREBASE_KEYS';
import { FLAT_LIST } from '../constants/SPACING';
import { db } from './firebase';

const eventsRef = collection(db, COLLECTIONS.EVENTS);
const PAGE_SIZE = FLAT_LIST.PAGE_SIZE;

function applyDateFilter(events, dateRange) {
  if (!dateRange) return events;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return events.filter((event) => {
    const t = event.startDate?.toMillis?.() ?? event.startDate?.seconds * 1000 ?? 0;
    if (dateRange === 'today') {
      const d = new Date(t);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }
    if (dateRange === 'week') return t >= startOfDay && t <= startOfDay + 7 * 86400000;
    if (dateRange === 'month') return t >= startOfDay && t <= startOfDay + 30 * 86400000;
    return true;
  });
}

function mapDocs(docs) {
  return docs.map((item) => ({ id: item.id, ...item.data() }));
}

function buildEventsQuery(filters = {}, pageSize = PAGE_SIZE, lastDoc = null) {
  const search = filters.search?.trim();
  let constraints;

  if (search) {
    constraints = [
      where('title', '>=', search),
      where('title', '<=', `${search}\uf8ff`),
      orderBy('title'),
    ];
  } else if (filters.category) {
    constraints = [
      where('category', '==', filters.category),
      orderBy('createdAt', 'desc'),
    ];
  } else {
    constraints = [orderBy('createdAt', 'desc')];
  }

  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));

  return query(eventsRef, ...constraints);
}

export function subscribeToEvents(callback, filters = {}, pageSize = PAGE_SIZE) {
  const q = buildEventsQuery(filters, pageSize);
  return onSnapshot(
    q,
    (snapshot) => {
      let events = applyDateFilter(mapDocs(snapshot.docs), filters.dateRange);
      events.sort((a, b) => {
        const aTime = a.startDate?.toMillis?.() ?? a.startDate?.seconds * 1000 ?? 0;
        const bTime = b.startDate?.toMillis?.() ?? b.startDate?.seconds * 1000 ?? 0;
        return aTime - bTime;
      });
      callback({
        events,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize,
      });
    },
    (error) => {
      console.error('[Firestore] events hatasi:', error.message);
      callback({ events: [], lastDoc: null, hasMore: false });
    },
  );
}

export async function fetchEventsPage(lastDoc = null, filters = {}) {
  const q = buildEventsQuery(filters, PAGE_SIZE, lastDoc);
  const snapshot = await getDocs(q);
  let events = applyDateFilter(mapDocs(snapshot.docs), filters.dateRange);
  events.sort((a, b) => {
    const aTime = a.startDate?.toMillis?.() ?? a.startDate?.seconds * 1000 ?? 0;
    const bTime = b.startDate?.toMillis?.() ?? b.startDate?.seconds * 1000 ?? 0;
    return aTime - bTime;
  });
  return {
    events,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export function subscribeToEvent(eventId, callback) {
  return onSnapshot(doc(db, COLLECTIONS.EVENTS, eventId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  });
}

export function subscribeToAttendees(eventId, callback) {
  const q = query(
    collection(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.ATTENDEES),
    orderBy('joinedAt', 'desc'),
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export function subscribeToComments(eventId, callback) {
  const q = query(
    collection(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.COMMENTS),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export function subscribeToEventLike(eventId, userId, callback) {
  if (!userId) {
    callback(false);
    return () => {};
  }
  return onSnapshot(
    doc(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.LIKES, userId),
    (snap) => callback(snap.exists()),
    () => callback(false),
  );
}

export async function getEvent(eventId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.EVENTS, eventId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function createEvent(data, organizer) {
  const docRef = await addDoc(eventsRef, {
    ...data,
    organizerId: organizer.uid,
    organizer: {
      displayName: organizer.displayName || '',
      photoURL: organizer.photoURL || '',
    },
    attendeeCount: 0,
    likeCount: 0,
    status: 'active',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function joinEvent(eventId, userId, status = 'confirmed') {
  const attendeeRef = doc(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.ATTENDEES, userId);
  await setDoc(attendeeRef, { joinedAt: serverTimestamp(), status });
}

export async function leaveEvent(eventId, userId) {
  const attendeeRef = doc(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.ATTENDEES, userId);
  await deleteDoc(attendeeRef);
}

export async function addEventComment(eventId, user, text) {
  await addDoc(collection(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.COMMENTS), {
    userId: user.uid,
    displayName: user.displayName || 'Kullanici',
    photoURL: user.photoURL || '',
    text,
    createdAt: serverTimestamp(),
  });
}

export async function updateEventCover(eventId, coverURL) {
  await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), { coverURL });
}

export async function isUserAttending(eventId, userId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.ATTENDEES, userId));
  return snapshot.exists();
}

export async function fetchMyEvents(userId) {
  const q = query(eventsRef, where('organizerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function fetchJoinedEvents(userId) {
  const snapshot = await getDocs(eventsRef);
  const joined = [];
  await Promise.all(
    snapshot.docs.map(async (eventDoc) => {
      const att = await getDoc(
        doc(db, COLLECTIONS.EVENTS, eventDoc.id, SUBCOLLECTIONS.ATTENDEES, userId),
      );
      if (att.exists()) joined.push({ id: eventDoc.id, ...eventDoc.data() });
    }),
  );
  return joined;
}

export async function saveEvent(userId, eventId) {
  await setDoc(doc(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.SAVED_EVENTS, eventId), {
    savedAt: serverTimestamp(),
  });
}

export async function unsaveEvent(userId, eventId) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.SAVED_EVENTS, eventId));
}

export function subscribeToSavedEvents(userId, callback) {
  return onSnapshot(
    collection(db, COLLECTIONS.USERS, userId, SUBCOLLECTIONS.SAVED_EVENTS),
    async (snapshot) => {
      const ids = snapshot.docs.map((d) => d.id);
      if (!ids.length) {
        callback([]);
        return;
      }
      const events = await Promise.all(ids.map((id) => getEvent(id)));
      callback(events.filter(Boolean));
    },
    () => callback([]),
  );
}

export { Timestamp };
