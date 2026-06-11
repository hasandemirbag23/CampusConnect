import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants';
import { createListingChat } from '../../services/chatService';
import { recordListingView } from '../../services/likeService';
import { fetchSimilarListings, subscribeToListing } from '../../services/marketService';
import { trackEvent } from '../../services/analyticsService';
import { formatPrice, showAlert } from '../../utils';

export default function ListingDetailScreen({ route, navigation }) {
  const { listingId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const { markAsSold } = useMarket();
  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const opacity = useSharedValue(0);

  useEffect(() => {
    recordListingView(listingId).catch(() => {});
    trackEvent('listing_viewed', { listing_id: listingId });
    const unsub = subscribeToListing(listingId, setListing);
    return unsub;
  }, [listingId]);

  useEffect(() => {
    if (listing?.category) {
      fetchSimilarListings(listing.category, listingId).then(setSimilar);
    }
  }, [listing?.category, listingId]);

  useEffect(() => {
    if (listing) opacity.value = withTiming(1, { duration: 400 });
  }, [listing, opacity]);

  const heroStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const handleMessage = async () => {
    if (!user || !listing) return;
    if (listing.sellerId === user.uid) {
      showAlert('Bilgi', 'Kendi ilaniniza mesaj gonderemezsiniz');
      return;
    }
    try {
      const chatId = await createListingChat(
        listingId,
        { uid: user.uid, displayName: user.displayName },
        listing.sellerId,
        listing.seller?.displayName || 'Satici',
      );
      navigation.navigate('ChatTab', { screen: 'ChatDetail', params: { chatId, title: listing.seller?.displayName } });
    } catch (e) {
      showAlert('Hata', e.message);
    }
  };

  const handleSold = async () => {
    try {
      await markAsSold(listingId);
      showAlert('Basarili', 'Ilan satildi olarak isaretlendi');
    } catch (e) {
      showAlert('Hata', e.message);
    }
  };

  if (!listing) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  const images = listing.imageURLs?.length ? listing.imageURLs : listing.imageURL ? [listing.imageURL] : [];
  const isSeller = user?.uid === listing.sellerId;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <Animated.View style={heroStyle}>
          {images.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {images.map((uri, i) => (
                <Image key={uri + i} source={{ uri }} style={styles.image} contentFit="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.image, styles.placeholder, { backgroundColor: colors.primaryLight }]} />
          )}
        </Animated.View>
        <View style={styles.content}>
          {listing.status === 'sold' ? (
            <View style={[styles.soldBadge, { backgroundColor: colors.textMuted }]}>
              <Text style={styles.soldText}>Satildi</Text>
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.text }]}>{listing.title}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(listing.price)}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {listing.category} · {listing.condition} · {listing.viewCount || 0} goruntulenme
          </Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{listing.description}</Text>
          <Text style={[styles.seller, { color: colors.text }]}>Satici: {listing.seller?.displayName || 'Anonim'}</Text>
          {similar.length > 0 && (
            <>
              <Text style={[styles.section, { color: colors.text }]}>Benzer Ilanlar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similar.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => navigation.push('ListingDetail', { listingId: item.id })}
                    style={[styles.similar, { backgroundColor: colors.card }]}
                  >
                    <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600' }}>{item.title}</Text>
                    <Text style={{ color: colors.primary }}>{formatPrice(item.price)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>
      {isSeller ? (
        <View style={styles.sellerActions}>
          <Pressable onPress={() => navigation.navigate('CreateListing', { listingId })} style={[styles.btnOutline, { borderColor: colors.primary }]}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Duzenle</Text>
          </Pressable>
          {listing.status !== 'sold' && (
            <Pressable onPress={handleSold} style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}>
              <Text style={styles.btnText}>Satildi Isaretle</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable onPress={handleMessage} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Text style={styles.btnText}>Mesaj Gonder</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { height: 260, width: 360 },
  placeholder: { width: '100%' },
  content: { padding: SPACING.md },
  soldBadge: { alignSelf: 'flex-start', borderRadius: RADIUS.sm, marginBottom: 8, paddingHorizontal: 10, paddingVertical: 4 },
  soldText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800' },
  price: { fontSize: 24, fontWeight: '800', marginTop: 8 },
  meta: { fontSize: 13, marginTop: 4, textTransform: 'capitalize' },
  desc: { fontSize: 15, lineHeight: 22, marginTop: SPACING.md },
  seller: { fontSize: 14, fontWeight: '600', marginTop: SPACING.md },
  section: { fontSize: 16, fontWeight: '700', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  similar: { borderRadius: RADIUS.md, marginRight: SPACING.sm, padding: SPACING.sm, width: 140 },
  sellerActions: { flexDirection: 'row', gap: SPACING.sm, margin: SPACING.md },
  btnOutline: { alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: 16 },
  btn: { alignItems: 'center', margin: SPACING.md, paddingVertical: 16, borderRadius: RADIUS.md },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
