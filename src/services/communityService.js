import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { COLLECTIONS, SUBCOLLECTIONS } from '../constants/FIREBASE_KEYS';
import { db } from './firebase';

const communitiesRef = collection(db, COLLECTIONS.COMMUNITIES);

export function subscribeToCommunities(callback) {
  return onSnapshot(
    communitiesRef,
    (snapshot) => {
      const communities = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      communities.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
      callback(communities);
    },
    (error) => {
      console.error('[Firestore] communities:', error.message);
      callback([]);
    },
  );
}

export function subscribeToCommunity(communityId, callback) {
  return onSnapshot(doc(db, COLLECTIONS.COMMUNITIES, communityId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export function subscribeToPosts(communityId, callback) {
  const q = query(
    collection(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.POSTS),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    () => callback([]),
  );
}

export function subscribeToPostComments(communityId, postId, callback) {
  const q = query(
    collection(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.POSTS, postId, SUBCOLLECTIONS.COMMENTS),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function createCommunity(data, creator) {
  const docRef = await addDoc(communitiesRef, {
    ...data,
    creatorId: creator.uid,
    memberCount: 0,
    postCount: 0,
    iconURL: data.iconURL || '',
    tags: data.tags || [],
    rules: data.rules || [],
    isPrivate: data.isPrivate || false,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, COLLECTIONS.COMMUNITIES, docRef.id, SUBCOLLECTIONS.MEMBERS, creator.uid), {
    joinedAt: serverTimestamp(),
    role: 'admin',
  });

  return docRef.id;
}

export async function joinCommunity(communityId, userId) {
  await setDoc(doc(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.MEMBERS, userId), {
    joinedAt: serverTimestamp(),
    role: 'member',
  });
}

export async function leaveCommunity(communityId, userId) {
  await deleteDoc(doc(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.MEMBERS, userId));
}

export async function isCommunityMember(communityId, userId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.MEMBERS, userId));
  return snapshot.exists();
}

export async function createPost(communityId, user, content, imageURLs = []) {
  return addDoc(collection(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.POSTS), {
    userId: user.uid,
    displayName: user.displayName || 'Kullanici',
    photoURL: user.photoURL || '',
    content,
    imageURLs: imageURLs.filter(Boolean).slice(0, 5),
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function addPostComment(communityId, postId, user, text) {
  await addDoc(
    collection(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.POSTS, postId, SUBCOLLECTIONS.COMMENTS),
    {
      userId: user.uid,
      displayName: user.displayName || 'Kullanici',
      photoURL: user.photoURL || '',
      text,
      createdAt: serverTimestamp(),
    },
  );
}

export function subscribeToPost(communityId, postId, callback) {
  return onSnapshot(
    doc(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.POSTS, postId),
    (snapshot) => {
      callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    () => callback(null),
  );
}

export function subscribeToPostLike(communityId, postId, userId, callback) {
  if (!userId) {
    callback(false);
    return () => {};
  }
  return onSnapshot(
    doc(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.POSTS, postId, SUBCOLLECTIONS.LIKES, userId),
    (snap) => callback(snap.exists()),
    () => callback(false),
  );
}

export function subscribeToJoinedCommunities(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    communitiesRef,
    async (snapshot) => {
      const joined = [];
      await Promise.all(
        snapshot.docs.map(async (communityDoc) => {
          const member = await getDoc(
            doc(db, COLLECTIONS.COMMUNITIES, communityDoc.id, SUBCOLLECTIONS.MEMBERS, userId),
          );
          if (member.exists()) joined.push({ id: communityDoc.id, ...communityDoc.data() });
        }),
      );
      callback(joined);
    },
    () => callback([]),
  );
}

export async function fetchJoinedCommunities(userId) {
  const snapshot = await getDocs(communitiesRef);
  const joined = [];
  await Promise.all(
    snapshot.docs.map(async (communityDoc) => {
      const member = await getDoc(
        doc(db, COLLECTIONS.COMMUNITIES, communityDoc.id, SUBCOLLECTIONS.MEMBERS, userId),
      );
      if (member.exists()) joined.push({ id: communityDoc.id, ...communityDoc.data() });
    }),
  );
  return joined;
}

export async function getCommunity(communityId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.COMMUNITIES, communityId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function getPost(communityId, postId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.POSTS, postId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export function subscribeToMembers(communityId, callback) {
  const q = query(
    collection(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.MEMBERS),
    orderBy('joinedAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    () => callback([]),
  );
}

export async function getMemberRole(communityId, userId) {
  const snapshot = await getDoc(
    doc(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.MEMBERS, userId),
  );
  return snapshot.exists() ? snapshot.data().role : null;
}

export async function removeMember(communityId, userId) {
  await deleteDoc(doc(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.MEMBERS, userId));
}

export async function setMemberRole(communityId, userId, role) {
  await updateDoc(doc(db, COLLECTIONS.COMMUNITIES, communityId, SUBCOLLECTIONS.MEMBERS, userId), { role });
}
