import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { COLLECTIONS, SUBCOLLECTIONS } from '../constants/FIREBASE_KEYS';
import { getChatTimestamp } from '../utils';
import { db } from './firebase';

const chatsRef = collection(db, COLLECTIONS.CHATS);

function sortChats(chats) {
  return chats.sort((a, b) => {
    const aTime = getChatTimestamp(a)?.toMillis?.() ?? 0;
    const bTime = getChatTimestamp(b)?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

export function subscribeToUserChats(userId, callback) {
  const q = query(chatsRef, where('participants', 'array-contains', userId));
  return onSnapshot(
    q,
    (snapshot) => callback(sortChats(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))),
    () => callback([]),
  );
}

export function subscribeToMessages(chatId, callback) {
  const q = query(
    collection(db, COLLECTIONS.CHATS, chatId, SUBCOLLECTIONS.MESSAGES),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function getOrCreateChat(userId, otherUserId, otherUser, currentUser) {
  const q = query(chatsRef, where('participants', 'array-contains', userId));
  const snapshot = await getDocs(q);

  const existing = snapshot.docs.find((item) => {
    const participants = item.data().participants || [];
    return participants.includes(otherUserId);
  });

  if (existing) return existing.id;

  const chatRef = await addDoc(chatsRef, {
    participants: [userId, otherUserId],
    participantInfo: {
      [userId]: { displayName: currentUser?.displayName || '' },
      [otherUserId]: { displayName: otherUser.displayName || '' },
    },
    lastMessage: null,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadCount: { [userId]: 0, [otherUserId]: 0 },
    createdAt: serverTimestamp(),
  });

  return chatRef.id;
}

export async function sendMessage(chatId, senderId, text, imageURL = '') {
  await addDoc(collection(db, COLLECTIONS.CHATS, chatId, SUBCOLLECTIONS.MESSAGES), {
    senderId,
    text: text || '',
    imageURL: imageURL || '',
    type: imageURL ? 'image' : 'text',
    createdAt: serverTimestamp(),
    read: false,
  });
}

export async function markChatRead(chatId, userId) {
  await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), {
    [`unreadCount.${userId}`]: 0,
  });
}

export async function createListingChat(listingId, buyer, sellerId, sellerName) {
  const chatId = await getOrCreateChat(
    buyer.uid,
    sellerId,
    { displayName: sellerName },
    { displayName: buyer.displayName },
  );
  await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), {
    relatedListingId: listingId,
    type: 'listing',
    updatedAt: serverTimestamp(),
  });
  return chatId;
}
