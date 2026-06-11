import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants';
import { subscribeToNotifications } from '../services/userService';

export default function AppHeader({ title, showAvatar = true, onNotificationPress }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeToNotifications(user.uid, (items) => {
      setHasUnread(items.some((n) => !n.read));
    });
  }, [user]);

  return (
    <View style={[styles.row, { backgroundColor: colors.background, paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.left}>
        {showAvatar ? (
          profile?.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
          )
        ) : null}
        <Text style={[styles.logoText, { color: colors.primary }]}>{title || 'CampusConnect'}</Text>
      </View>

      <Pressable onPress={onNotificationPress} style={styles.bell}>
        <Ionicons name="notifications-outline" size={24} color={colors.text} />
        {hasUnread ? <View style={[styles.dot, { backgroundColor: colors.error, borderColor: colors.background }]} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  left: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  avatar: { borderRadius: 18, height: 36, width: 36 },
  logoText: { fontSize: 20, fontWeight: '800' },
  bell: { padding: 4 },
  dot: { borderRadius: 5, borderWidth: 1.5, height: 10, position: 'absolute', right: 2, top: 2, width: 10 },
});
