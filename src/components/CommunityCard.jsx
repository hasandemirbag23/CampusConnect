import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOW, SPACING } from '../constants';

function CommunityCard({ community, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => onPress?.(community)}
      style={({ pressed }) => [styles.card, SHADOW.card, { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1 }]}
    >
      <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="people" size={24} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{community.name}</Text>
        <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>{community.description}</Text>
        <View style={styles.meta}>
          <Text style={[styles.badge, { color: colors.primary }]}>{community.category}</Text>
          <Text style={[styles.members, { color: colors.textSecondary }]}>{community.memberCount || 0} uye</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default memo(CommunityCard);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  icon: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    height: 48,
    justifyContent: 'center',
    marginRight: SPACING.md,
    width: 48,
  },
  content: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, marginTop: 4 },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { fontSize: 12, fontWeight: '600' },
  members: { fontSize: 12 },
});
