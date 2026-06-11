import Constants from 'expo-constants';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GLOBAL_KEY = '__campusConnectFirebase__';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isUsingEmulator =
  process.env.EXPO_PUBLIC_USE_EMULATOR === 'true' ||
  Constants.expoConfig?.extra?.useEmulator === true;

function getEmulatorHost() {
  if (Platform.OS === 'web') {
    return '127.0.0.1';
  }

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return '10.0.2.2';
  }

  if (process.env.EXPO_PUBLIC_EMULATOR_HOST) {
    return process.env.EXPO_PUBLIC_EMULATOR_HOST;
  }

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri ??
    Constants.linkingUri;
  if (debuggerHost) {
    const host = String(debuggerHost).replace(/^https?:\/\//, '').split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  if (Platform.OS === 'android') return '10.0.2.2';
  return '127.0.0.1';
}

function connectEmulators(auth, db, storage, functions) {
  const host = getEmulatorHost();

  const safeConnect = (fn) => { try { fn(); } catch { /* HMR */ } };
  safeConnect(() => connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true }));
  safeConnect(() => connectFirestoreEmulator(db, host, 8080));
  safeConnect(() => {
    connectStorageEmulator(storage, host, 9199);
    connectFunctionsEmulator(functions, host, 5001);
  });

  if (__DEV__) {
    console.log('[Firebase] EMULATOR →', host, '| Auth+Firestore+Storage');
  }
}

function initAuth(app) {
  if (!isUsingEmulator) {
    return getAuth(app);
  }

  try {
    const persistence =
      Platform.OS === 'web'
        ? inMemoryPersistence
        : getReactNativePersistence(AsyncStorage);
    return initializeAuth(app, { persistence });
  } catch {
    return getAuth(app);
  }
}

function initFirebase() {
  const cached = globalThis[GLOBAL_KEY];
  if (cached && cached.mode === (isUsingEmulator ? 'emulator' : 'production')) {
    return cached;
  }

  delete globalThis[GLOBAL_KEY];

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = initAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app);

  if (isUsingEmulator) {
    connectEmulators(auth, db, storage, functions);
  } else if (__DEV__) {
    console.warn('[Firebase] PRODUCTION modu aktif!');
  }

  const instance = { app, auth, db, storage, functions, mode: isUsingEmulator ? 'emulator' : 'production' };
  globalThis[GLOBAL_KEY] = instance;
  return instance;
}

const firebase = initFirebase();

export const app = firebase.app;
export const auth = firebase.auth;
export const db = firebase.db;
export const storage = firebase.storage;
export const functions = firebase.functions;

let analyticsInstance = null;

export async function getAnalyticsInstance() {
  if (isUsingEmulator) return null;
  if (analyticsInstance) return analyticsInstance;
  const supported = await isSupported();
  if (supported) analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

export default app;
