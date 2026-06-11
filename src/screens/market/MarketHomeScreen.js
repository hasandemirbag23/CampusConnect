import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { FilterChip, FilterChipRow } from '../../components/FilterChipRow';
import ListingCard from '../../components/ListingCard';
import SkeletonCard from '../../components/SkeletonCard';
import { useMarket } from '../../context/MarketContext';
import { useTheme } from '../../context/ThemeContext';
import { FLAT_LIST, LISTING_CATEGORIES, RADIUS, SPACING } from '../../constants';
import { showAlert } from '../../utils';

export default function MarketHomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { listings, savedListings, isLoading, filters, setFilters, saveListing, loadMore, hasMore, refreshListings } = useMarket();
  const [search, setSearch] = useState('');
  const [showSold, setShowSold] = useState(false);

  const savedIds = useMemo(() => new Set(savedListings.map((l) => l.id)), [savedListings]);

  const filtered = useMemo(() => {
    let result = listings;
    if (search) result = result.filter((l) => l.title?.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [listings, search]);

  const handlePress = useCallback(
    (listing) => navigation.navigate('ListingDetail', { listingId: listing.id }),
    [navigation],
  );

  const toggleSave = useCallback(
    async (listing) => {
      try {
        await saveListing(listing.id, !savedIds.has(listing.id));
      } catch (e) {
        showAlert('Hata', e.message);
      }
    },
    [saveListing, savedIds],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ListingCard
        listing={item}
        onPress={handlePress}
        saved={savedIds.has(item.id)}
        onToggleSave={toggleSave}
      />
    ),
    [handlePress, savedIds, toggleSave],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Kampus Market</Text>
          <Pressable
            onPress={() => navigation.navigate('MyListings')}
            style={[styles.myBtn, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>Ilanlarim</Text>
          </Pressable>
        </View>

        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Ilanlarda ara..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(t) => {
              setSearch(t);
            }}
            style={[styles.searchInput, { color: colors.text }]}
          />
          <Pressable
            onPress={() => {
              const next = !showSold;
              setShowSold(next);
              setFilters({ status: next ? null : 'active' });
            }}
          >
            <Ionicons name="options-outline" size={20} color={showSold ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>

        <FilterChipRow style={styles.chipSection}>
          <FilterChip label="Hepsi" active={!filters.category} onPress={() => setFilters({ category: null })} colors={colors} />
          {LISTING_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={filters.category === cat}
              onPress={() => setFilters({ category: cat })}
              colors={colors}
            />
          ))}
        </FilterChipRow>

        <View style={styles.priceRow}>
          <TextInput
            placeholder="Min ₺"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={filters.minPrice != null ? String(filters.minPrice) : ''}
            onChangeText={(t) => setFilters({ minPrice: t ? Number(t) : null })}
            style={[styles.priceInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          />
          <Text style={{ color: colors.textMuted }}>—</Text>
          <TextInput
            placeholder="Max ₺"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={filters.maxPrice != null ? String(filters.maxPrice) : ''}
            onChangeText={(t) => setFilters({ maxPrice: t ? Number(t) : null })}
            style={[styles.priceInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          />
        </View>
      </View>
    ),
    [colors, search, showSold, filters, navigation, setFilters],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader onNotificationPress={() => navigation.navigate('ProfileTab', { screen: 'Notifications' })} />

      {isLoading && listings.length === 0 ? (
        <View style={styles.loadingWrap}>
          {listHeader}
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<EmptyState title="Henuz ilan yok" subtitle="+ ile ilan ver" />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={FLAT_LIST.INITIAL_NUM}
          windowSize={FLAT_LIST.WINDOW_SIZE}
          onEndReached={() => hasMore && !isLoading && loadMore()}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refreshListings()}
            />
          }
        />
      )}

      <Pressable onPress={() => navigation.navigate('CreateListing')} style={styles.fab}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.fabInner}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, paddingHorizontal: SPACING.md },
  listContent: { paddingBottom: 100, paddingHorizontal: SPACING.md },
  row: { justifyContent: 'space-between' },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  pageTitle: { fontSize: 26, fontWeight: '800' },
  myBtn: { borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7 },
  search: {
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chipSection: { marginBottom: SPACING.sm },
  priceRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  priceInput: { borderRadius: RADIUS.md, borderWidth: 1, flex: 1, fontSize: 14, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  fab: {
    borderRadius: 28,
    bottom: SPACING.lg,
    elevation: 6,
    height: 56,
    position: 'absolute',
    right: SPACING.lg,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 56,
  },
  fabInner: { alignItems: 'center', borderRadius: 28, flex: 1, justifyContent: 'center' },
});
