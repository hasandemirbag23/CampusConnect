require('dotenv').config();

module.exports = ({ config }) => ({
  ...config,
  extra: {
    useEmulator: process.env.EXPO_PUBLIC_USE_EMULATOR === 'true',
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  },
});
