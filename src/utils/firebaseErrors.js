export function getFirebaseErrorMessage(error) {
  const code = error?.code || '';

  const messages = {
    'auth/configuration-not-found':
      'Firebase Authentication acilmamis. Console > Authentication > Get started > Email/Password ac.',
    'auth/operation-not-allowed':
      'Email/Password girisi kapali. Firebase Console > Authentication > Sign-in method > Email/Password ac.',
    'auth/email-already-in-use': 'Bu email zaten kayitli.',
    'auth/invalid-email': 'Gecersiz email adresi.',
    'auth/weak-password': 'Sifre cok zayif. En az 6 karakter kullan.',
    'auth/user-not-found': 'Kullanici bulunamadi.',
    'auth/wrong-password': 'Hatali sifre.',
    'auth/invalid-credential': 'Email veya sifre hatali.',
    'auth/too-many-requests': 'Cok fazla deneme. Biraz bekle.',
  };

  return messages[code] || error?.message || 'Bilinmeyen hata';
}
