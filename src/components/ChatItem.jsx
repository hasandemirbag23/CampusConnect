import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants';
import { formatChatTime, getChatPreview, getChatTimestamp } from '../utils';

function ChatItem({ chat, name, unread, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.avatar}>
        <Text style={styles.avatarText}>{name[0]?.toUpperCase()}</Text>
      </LinearGradient>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
          <Text style={[styles.time, { color: unread ? colors.primary : colors.textMuted }]}>
            {formatChatTime(getChatTimestamp(chat))}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.preview,
              { color: unread ? colors.text : colors.textMuted, fontWeight: unread ? '600' : '400' },
            ]}
            numberOfLines={1}
          >
            {getChatPreview(chat)}
          </Text>
          {unread > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default memo(ChatItem);

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.sm },
  avatar: { alignItems: 'center', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  content: { flex: 1 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  name: { flex: 1, fontSize: 16, fontWeight: '700' },
  time: { fontSize: 12, marginLeft: 8 },
  bottomRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  preview: { flex: 1, fontSize: 14 },
  badge: {
    alignItems: 'center',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 22,
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
