import { memo } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOW, SPACING } from '../constants';
import { formatDate } from '../utils';

const CATEGORY_COLORS = {
  Konser: { bg: '#EDE9FE', text: '#7C3AED' },
  Seminer: { bg: '#DBEAFE', text: '#2563EB' },
  Spor: { bg: '#FCE7F3', text: '#DB2777' },
  Sosyal: { bg: '#EDE9FE', text: '#7C3AED' },
  Akademik: { bg: '#D1FAE5', text: '#059669' },
};

function EventCard({ event, onPress }) {
  const { colors } = useTheme();
  const cat = CATEGORY_COLORS[event.category] || { bg: colors.primaryLight, text: colors.primary };

  return (
    <Pressable
      onPress={() => onPress?.(event)}
      style={({ pressed }) => [
        styles.card,
        SHADOW.card,
        { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1 },
      ]}
    >
      {event.coverURL ? (
        <Image source={{ uri: event.coverURL }} style={styles.thumb} contentFit="cover" />
      ) : (
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.thumb}>
          <Ionicons name="calendar" size={26} color="rgba(255,255,255,0.95)" />
        </LinearGradient>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>{formatDate(event.startDate)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {event.isOnline ? 'Online' : event.location || 'Konum belirtilmedi'}
          </Text>
        </View>
      </View>

      <View style={[styles.badge, { backgroundColor: cat.bg }]}>
        <Text style={[styles.badgeText, { color: cat.text }]}>{(event.category || '').toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

export default memo(EventCard);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    height: 88,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
  },
  thumb: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  content: { flex: 1, marginLeft: SPACING.md },
  title: { fontSize: 15, fontWeight: '700' },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 4 },
  meta: { flex: 1, fontSize: 12 },
  badge: { alignSelf: 'flex-start', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});
