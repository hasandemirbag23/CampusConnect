import { useCallback } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import { useMarket } from '../../context/MarketContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SHADOW, SPACING } from '../../constants';
import { formatPrice, showAlert, showConfirm } from '../../utils';

export default function MyListingsScreen({ navigation }) {
  const { colors } = useTheme();
  const { myListings, markAsSold, deleteListing } = useMarket();

  const handlePress = useCallback(
    (listing) => navigation.navigate('ListingDetail', { listingId: listing.id }),
    [navigation],
  );

  const handleSold = (l) => {
    showConfirm('Satildi', `"${l.title}" satildi olarak isaretlensin mi?`, async () => {
      try {
        await markAsSold(l.id);
      } catch (e) {
        showAlert('Hata', e.message);
      }
    }, 'Isaretle');
  };

  const handleDelete = (l) => {
    showConfirm('Ilani Sil', `"${l.title}" kalici olarak silinsin mi?`, async () => {
      try {
        await deleteListing(l.id);
      } catch (e) {
        showAlert('Hata', e.message);
      }
    }, 'Sil');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
        {myListings.length === 0 ? (
          <EmptyState title="Henuz ilaniniz yok" subtitle="Market'ten ilan olusturun" />
        ) : (
          myListings.map((l) => {
            const cover = l.imageURLs?.[0] || l.imageURL;
            const isSold = l.status === 'sold';
            return (
              <View key={l.id} style={[styles.card, SHADOW.card, { backgroundColor: colors.card }]}>
                <Pressable onPress={() => handlePress(l)} style={styles.row}>
                  {cover ? (
                    <Image source={{ uri: cover }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="bag-outline" size={22} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{l.title}</Text>
                    <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(l.price)}</Text>
                    <Text style={[styles.status, { color: isSold ? colors.error : colors.success }]}>
                      {isSold ? 'Satildi' : 'Aktif'} · {l.viewCount || 0} goruntulenme
                    </Text>
                  </View>
                </Pressable>
                <View style={styles.actions}>
                  <Pressable onPress={() => navigation.navigate('CreateListing', { listingId: l.id })} style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </Pressable>
                  {!isSold && (
                    <Pressable onPress={() => handleSold(l)} style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons name="checkmark-done" size={18} color={colors.success} />
                    </Pressable>
                  )}
                  <Pressable onPress={() => handleDelete(l)} style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: RADIUS.lg, marginBottom: SPACING.sm, padding: SPACING.sm },
  row: { alignItems: 'center', flexDirection: 'row', gap: SPACING.md },
  thumb: { borderRadius: RADIUS.md, height: 60, width: 60 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700' },
  price: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  status: { fontSize: 12, marginTop: 2 },
  actions: { borderTopColor: 'rgba(0,0,0,0.05)', borderTopWidth: 1, flexDirection: 'row', gap: SPACING.sm, justifyContent: 'flex-end', marginTop: SPACING.sm, paddingTop: SPACING.sm },
  actionBtn: { alignItems: 'center', borderRadius: RADIUS.md, height: 36, justifyContent: 'center', width: 44 },
});
