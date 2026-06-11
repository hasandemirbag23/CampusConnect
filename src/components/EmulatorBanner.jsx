import { StyleSheet, Text, View } from 'react-native';

import { isUsingEmulator } from '../services/firebase';

const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'campusconnect-9758a';

export default function EmulatorBanner() {
  if (!__DEV__) return null;

  return (
    <View style={[styles.banner, { backgroundColor: isUsingEmulator ? '#16A34A' : '#2563EB' }]}>
      <Text style={styles.text}>
        {isUsingEmulator ? `EMULATOR | ${PROJECT_ID}` : `CANLI | ${PROJECT_ID}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingHorizontal: 12, paddingVertical: 6 },
  text: { color: '#fff', fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
