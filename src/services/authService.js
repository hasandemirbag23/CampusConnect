import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { COLLECTIONS } from '../constants/FIREBASE_KEYS';
import { auth, db, functions } from './firebase';

export async function registerWithEmail(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await sendEmailVerification(credential.user);
  await createUserDocument(credential.user, { displayName });
  return credential.user;
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function loginWithGoogleWeb() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  await createUserDocument(credential.user);
  return credential.user;
}

export async function signInWithGoogleIdToken(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  await createUserDocument(userCredential.user);
  return userCredential.user;
}

/** @deprecated use loginWithGoogleWeb or signInWithGoogleIdToken */
export async function loginWithGoogle() {
  return loginWithGoogleWeb();
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  await signOut(auth);
}

export async function createUserDocument(user, extra = {}) {
  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: extra.displayName || user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      department: '',
      year: null,
      bio: '',
      interests: [],
      followersCount: 0,
      followingCount: 0,
      fcmToken: '',
      createdAt: serverTimestamp(),
    });
    if (__DEV__) console.log('[Firestore] users/' + user.uid + ' olusturuldu');
  }
}

export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function updateUserProfile(uid, data) {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await setDoc(userRef, data, { merge: true });
  if (auth.currentUser?.uid === uid) {
    const authFields = {};
    if (data.displayName !== undefined) authFields.displayName = data.displayName;
    if (data.photoURL !== undefined) authFields.photoURL = data.photoURL;
    if (Object.keys(authFields).length) {
      await updateProfile(auth.currentUser, authFields);
    }
  }
}

export async function saveFcmToken(uid, token) {
  await updateUserProfile(uid, { fcmToken: token });
}

export async function deleteAccount() {
  const current = auth.currentUser;
  if (!current) throw new Error('Oturum bulunamadi');
  const fn = httpsCallable(functions, 'deleteUserData');
  await fn();
  await deleteUser(current);
}
