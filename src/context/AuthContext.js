import { onAuthStateChanged } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { GOOGLE_AUTH_CONFIG, isGoogleAuthConfigured } from '../constants/googleAuth';
import {
  createUserDocument,
  getUserProfile,
  loginWithEmail,
  loginWithGoogleWeb,
  logoutUser,
  registerWithEmail,
  resetPassword,
  saveFcmToken,
  signInWithGoogleIdToken,
  updateUserProfile,
} from '../services/authService';
import { auth } from '../services/firebase';
import { deleteToken } from '../services/notificationService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [googleRequest, , promptGoogleAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: GOOGLE_AUTH_CONFIG.webClientId,
      iosClientId: GOOGLE_AUTH_CONFIG.iosClientId,
      androidClientId: GOOGLE_AUTH_CONFIG.androidClientId,
      selectAccount: true,
    },
    { scheme: 'campusconnect' },
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email, password) => {
    const firebaseUser = await loginWithEmail(email, password);
    const userProfile = await getUserProfile(firebaseUser.uid);
    setProfile(userProfile);
    return firebaseUser;
  }, []);

  const loginGoogle = useCallback(async () => {
    if (Platform.OS === 'web') {
      const firebaseUser = await loginWithGoogleWeb();
      const userProfile = await getUserProfile(firebaseUser.uid);
      setProfile(userProfile);
      return firebaseUser;
    }

    if (!isGoogleAuthConfigured()) {
      throw new Error('Google Client ID yapilandirilmamis (.env dosyasini kontrol et)');
    }
    if (!googleRequest) {
      throw new Error('Google giris hazir degil, lutfen tekrar dene');
    }

    try {
      setGoogleLoading(true);
      const result = await promptGoogleAsync();

      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Giris iptal edildi');
      }
      if (result.type !== 'success') {
        throw new Error('Google giris basarisiz');
      }

      const idToken = result.params?.id_token;
      if (!idToken) throw new Error('Google token alinamadi');

      const firebaseUser = await signInWithGoogleIdToken(idToken);
      const userProfile = await getUserProfile(firebaseUser.uid);
      setUser(firebaseUser);
      setProfile(userProfile);
      return firebaseUser;
    } finally {
      setGoogleLoading(false);
    }
  }, [googleRequest, promptGoogleAsync]);

  const register = useCallback(async (email, password, displayName) => {
    const firebaseUser = await registerWithEmail(email, password, displayName);
    const userProfile = await getUserProfile(firebaseUser.uid);
    setProfile(userProfile);
    return firebaseUser;
  }, []);

  const logout = useCallback(async () => {
    if (user?.uid) await deleteToken(user.uid);
    await logoutUser();
    setUser(null);
    setProfile(null);
  }, [user]);

  const forgotPassword = useCallback(async (email) => {
    await resetPassword(email);
  }, []);

  const updateProfile = useCallback(async (data) => {
    if (!user) return;
    await updateUserProfile(user.uid, data);
    const userProfile = await getUserProfile(user.uid);
    setProfile(userProfile);
  }, [user]);

  const registerFcmToken = useCallback(async (token) => {
    if (!user) return;
    await saveFcmToken(user.uid, token);
  }, [user]);

  const needsProfileCompletion = useMemo(
    () => Boolean(profile && (!profile.department || !profile.year)),
    [profile],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthenticated: Boolean(user),
      isLoading,
      googleLoading,
      isGoogleReady: Platform.OS === 'web' || (isGoogleAuthConfigured() && Boolean(googleRequest)),
      needsProfileCompletion,
      login,
      loginGoogle,
      register,
      logout,
      forgotPassword,
      updateProfile,
      registerFcmToken,
      createUserDocument,
    }),
    [
      user,
      profile,
      isLoading,
      googleLoading,
      googleRequest,
      needsProfileCompletion,
      login,
      loginGoogle,
      register,
      logout,
      forgotPassword,
      updateProfile,
      registerFcmToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth AuthProvider icinde kullanilmali');
  }
  return context;
}
