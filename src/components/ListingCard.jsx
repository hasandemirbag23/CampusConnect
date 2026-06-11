import { memo } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOW, SPACING } from '../constants';
import { formatPrice } from '../utils';

const CONDITION_BADGE = {
  new: 'YENI',
  'like-new': 'YENI GIBI',
  good: 'AZ KULLANILMIS',
  fair: 'KULLANILMIS',
};

function ListingCard({ listing, onPress, saved, onToggleSave }) {
  const { colors } = useTheme();
  const isSold = listing.status === 'sold';
  const cover = listing.imageURLs?.[0] || listing.imageURL;

  return (
    <Pressable
      onPress={() => onPress?.(listing)}
      style={({ pressed }) => [styles.card, SHADOW.card, { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1 }]}
    >
      <View>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="bag-outline" size={32} color={colors.primary} />
          </View>
        )}
        {isSold ? <View style={styles.soldOverlay}><Text style={styles.soldText}>SATILDI</Text></View> : null}
        <View style={[styles.badge, { backgroundColor: isSold ? colors.textMuted : colors.primary }]}>
          <Text style={styles.badgeText}>{isSold ? 'SATILDI' : (CONDITION_BADGE[listing.condition] || '')}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{listing.title}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>{listing.category}</Text>
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(listing.price)}</Text>
          {onToggleSave ? (
            <Pressable onPress={(e) => { e.stopPropagation?.(); onToggleSave(listing); }} hitSlop={8}>
              <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? colors.error : colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default memo(ListingCard);

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, marginBottom: SPACING.md, overflow: 'hidden', width: '48%' },
  image: { height: 130, width: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  soldOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center' },
  soldText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  badge: { borderRadius: RADIUS.sm, left: 8, position: 'absolute', top: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  content: { padding: SPACING.sm },
  title: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 11, marginTop: 2 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  price: { fontSize: 16, fontWeight: '800' },
});
