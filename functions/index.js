const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp, FieldPath } = require('firebase-admin/firestore');
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');

initializeApp();
const db = getFirestore();

const PREF_KEYS = {
  event_join: 'events',
  event_reminder: 'events',
  post_like: 'posts',
  follow: 'social',
  message: 'messages',
};

async function sendExpoPush(token, title, body, data = {}) {
  if (!token || !token.startsWith('ExponentPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, sound: 'default', title, body, data }),
    });
  } catch (err) {
    console.warn('[FCM] push failed:', err.message);
  }
}

async function createNotification(userId, data) {
  const userSnap = await db.doc(`users/${userId}`).get();
  const userData = userSnap.data() || {};
  const prefs = userData.notificationPrefs || {};
  const prefKey = PREF_KEYS[data.type];
  if (prefKey && prefs[prefKey] === false) return;

  await db.collection('users').doc(userId).collection('notifications').add({
    type: data.type,
    text: data.text,
    read: false,
    relatedId: data.relatedId || '',
    createdAt: FieldValue.serverTimestamp(),
  });

  const title = data.type === 'message' ? 'Yeni Mesaj' : 'CampusConnect';
  await sendExpoPush(userData.fcmToken, title, data.text, { type: data.type, relatedId: data.relatedId || '' });
}

exports.onEventJoin = onDocumentCreated('events/{eventId}/attendees/{userId}', async (event) => {
  const { eventId, userId } = event.params;
  const eventSnap = await db.doc(`events/${eventId}`).get();
  const eventData = eventSnap.data() || {};
  await db.doc(`events/${eventId}`).update({ attendeeCount: FieldValue.increment(1) });
  if (eventData.organizerId && eventData.organizerId !== userId) {
    await createNotification(eventData.organizerId, {
      type: 'event_join',
      text: 'Etkinliginize yeni bir katilimci var',
      relatedId: eventId,
    });
  }
});

exports.onEventLeave = onDocumentDeleted('events/{eventId}/attendees/{userId}', async (event) => {
  const { eventId } = event.params;
  await db.doc(`events/${eventId}`).update({ attendeeCount: FieldValue.increment(-1) });
});

exports.onCommunityJoin = onDocumentCreated('communities/{communityId}/members/{userId}', async (event) => {
  const { communityId } = event.params;
  await db.doc(`communities/${communityId}`).update({ memberCount: FieldValue.increment(1) });
});

exports.onCommunityLeave = onDocumentDeleted('communities/{communityId}/members/{userId}', async (event) => {
  const { communityId } = event.params;
  await db.doc(`communities/${communityId}`).update({ memberCount: FieldValue.increment(-1) });
});

exports.onPostCreate = onDocumentCreated('communities/{communityId}/posts/{postId}', async (event) => {
  const { communityId } = event.params;
  await db.doc(`communities/${communityId}`).update({ postCount: FieldValue.increment(1) });
});

exports.onCommentCreate = onDocumentCreated(
  'communities/{communityId}/posts/{postId}/comments/{commentId}',
  async (event) => {
    const { communityId, postId } = event.params;
    await db.doc(`communities/${communityId}/posts/${postId}`).update({
      commentCount: FieldValue.increment(1),
    });
  },
);

exports.onUserFollow = onDocumentCreated('users/{userId}/follows/{targetId}', async (event) => {
  const { userId, targetId } = event.params;
  const batch = db.batch();
  batch.update(db.doc(`users/${targetId}`), { followersCount: FieldValue.increment(1) });
  batch.update(db.doc(`users/${userId}`), { followingCount: FieldValue.increment(1) });
  await batch.commit();
  await createNotification(targetId, {
    type: 'follow',
    text: 'Yeni bir takipciniz var',
    relatedId: userId,
  });
});

exports.onUserUnfollow = onDocumentDeleted('users/{userId}/follows/{targetId}', async (event) => {
  const { userId, targetId } = event.params;
  const batch = db.batch();
  batch.update(db.doc(`users/${targetId}`), { followersCount: FieldValue.increment(-1) });
  batch.update(db.doc(`users/${userId}`), { followingCount: FieldValue.increment(-1) });
  await batch.commit();
});

exports.onMessageSent = onDocumentCreated('chats/{chatId}/messages/{msgId}', async (event) => {
  const { chatId } = event.params;
  const msg = event.data.data();
  const chatRef = db.doc(`chats/${chatId}`);
  const chatSnap = await chatRef.get();
  const chat = chatSnap.data() || {};
  const participants = chat.participants || [];
  const unreadCount = { ...(chat.unreadCount || {}) };
  participants.forEach((uid) => {
    if (uid !== msg.senderId) unreadCount[uid] = (unreadCount[uid] || 0) + 1;
  });
  await chatRef.update({
    lastMessage: {
      text: msg.text || (msg.imageURL ? 'Fotograf' : ''),
      senderId: msg.senderId,
      imageURL: msg.imageURL || '',
      createdAt: msg.createdAt || FieldValue.serverTimestamp(),
    },
    lastMessageAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    unreadCount,
  });
  await Promise.all(
    participants
      .filter((uid) => uid !== msg.senderId)
      .map((uid) =>
        createNotification(uid, {
          type: 'message',
          text: msg.text || 'Yeni mesaj',
          relatedId: chatId,
        }),
      ),
  );
});

exports.onPostLike = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Giris gerekli');
  const { communityId, postId, liked } = request.data || {};
  if (!communityId || !postId) throw new HttpsError('invalid-argument', 'Eksik parametre');

  const uid = request.auth.uid;
  const likeRef = db.doc(`communities/${communityId}/posts/${postId}/likes/${uid}`);
  const postRef = db.doc(`communities/${communityId}/posts/${postId}`);

  let notify = false;
  await db.runTransaction(async (tx) => {
    const likeSnap = await tx.get(likeRef);
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists) throw new HttpsError('not-found', 'Post bulunamadi');
    const hasLike = likeSnap.exists;
    if (liked && !hasLike) {
      tx.set(likeRef, { createdAt: FieldValue.serverTimestamp() });
      tx.update(postRef, { likeCount: FieldValue.increment(1) });
      notify = true;
    } else if (!liked && hasLike) {
      tx.delete(likeRef);
      tx.update(postRef, { likeCount: FieldValue.increment(-1) });
    }
  });

  if (notify) {
    const postSnap = await postRef.get();
    const ownerId = postSnap.data()?.userId;
    if (ownerId && ownerId !== uid) {
      await createNotification(ownerId, {
        type: 'post_like',
        text: 'Gonderiniz begenildi',
        relatedId: postId,
      });
    }
  }
  return { ok: true };
});

exports.toggleEventLike = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Giris gerekli');
  const { eventId, liked } = request.data || {};
  if (!eventId) throw new HttpsError('invalid-argument', 'eventId gerekli');

  const uid = request.auth.uid;
  const likeRef = db.doc(`events/${eventId}/likes/${uid}`);
  const eventRef = db.doc(`events/${eventId}`);

  await db.runTransaction(async (tx) => {
    const likeSnap = await tx.get(likeRef);
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) throw new HttpsError('not-found', 'Etkinlik bulunamadi');
    const hasLike = likeSnap.exists;
    if (liked && !hasLike) {
      tx.set(likeRef, { createdAt: FieldValue.serverTimestamp() });
      tx.update(eventRef, { likeCount: FieldValue.increment(1) });
    } else if (!liked && hasLike) {
      tx.delete(likeRef);
      tx.update(eventRef, { likeCount: FieldValue.increment(-1) });
    }
  });
  return { ok: true };
});

exports.onListingView = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Giris gerekli');
  const { listingId } = request.data || {};
  if (!listingId) throw new HttpsError('invalid-argument', 'listingId gerekli');
  await db.doc(`listings/${listingId}`).update({ viewCount: FieldValue.increment(1) });
  return { ok: true };
});

exports.sendEventReminder = onSchedule('every 60 minutes', async () => {
  const now = Timestamp.now();
  const oneHourLater = Timestamp.fromMillis(now.toMillis() + 60 * 60 * 1000);
  const snap = await db.collection('events')
    .where('status', '==', 'active')
    .where('startDate', '>=', now)
    .where('startDate', '<=', oneHourLater)
    .get();
  for (const docSnap of snap.docs) {
    const attendees = await docSnap.ref.collection('attendees').get();
    for (const att of attendees.docs) {
      await createNotification(att.id, {
        type: 'event_reminder',
        text: `"${docSnap.data().title}" 1 saat icinde basliyor`,
        relatedId: docSnap.id,
      });
    }
  }
});

async function deleteQueryBatch(queryRef) {
  const snapshot = await queryRef.limit(200).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
  if (snapshot.size >= 200) await deleteQueryBatch(queryRef);
}

exports.deleteUserData = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Giris gerekli');
  const uid = request.auth.uid;

  const userRef = db.doc(`users/${uid}`);
  for (const sub of ['notifications', 'savedEvents', 'savedListings', 'follows']) {
    await deleteQueryBatch(userRef.collection(sub));
  }

  await deleteQueryBatch(db.collection('listings').where('sellerId', '==', uid));

  const memberSnap = await db.collectionGroup('members').where(FieldPath.documentId(), '==', uid).get();
  for (const memberDoc of memberSnap.docs) {
    await memberDoc.ref.delete();
  }

  const attendeeSnap = await db.collectionGroup('attendees').where(FieldPath.documentId(), '==', uid).get();
  for (const attendeeDoc of attendeeSnap.docs) {
    await attendeeDoc.ref.delete();
  }

  const eventsSnap = await db.collection('events').where('organizerId', '==', uid).get();
  for (const eventDoc of eventsSnap.docs) {
    for (const sub of ['attendees', 'comments', 'likes']) {
      await deleteQueryBatch(eventDoc.ref.collection(sub));
    }
    await eventDoc.ref.delete();
  }

  const chatsSnap = await db.collection('chats').where('participants', 'array-contains', uid).get();
  for (const chatDoc of chatsSnap.docs) {
    await deleteQueryBatch(chatDoc.ref.collection('messages'));
    await chatDoc.ref.delete();
  }

  await userRef.delete();
  return { ok: true };
});
