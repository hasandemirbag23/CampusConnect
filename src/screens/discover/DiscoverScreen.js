import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '../../components/AppHeader';
import EventCard from '../../components/EventCard';
import EmptyState from '../../components/EmptyState';
import { FilterChip, FilterChipRow } from '../../components/FilterChipRow';
import SkeletonCard from '../../components/SkeletonCard';
import { useEvents } from '../../context/EventContext';
import { useTheme } from '../../context/ThemeContext';
import { EVENT_CATEGORIES, FLAT_LIST, RADIUS, SPACING } from '../../constants';
import { formatDate } from '../../utils';

const CATEGORY_ICONS = {
  Tumu: 'sparkles',
  Konser: 'musical-notes',
  Seminer: 'school',
  Spor: 'basketball',
  Sosyal: 'people',
  Akademik: 'book',
};

const DATE_FILTERS = [
  { key: 'today', label: 'Bugun' },
  { key: 'week', label: 'Bu Hafta' },
  { key: 'month', label: 'Bu Ay' },
];

const ITEM_HEIGHT = FLAT_LIST.EVENT_CARD_HEIGHT;

export default function DiscoverScreen({ navigation }) {
  const { colors } = useTheme();
  const { events, isLoading, refreshEvents, setFilters, filters, loadMore, hasMore } = useEvents();
  const [search, setSearch] = useState(filters.search || '');

  const featured = useMemo(() => events.slice(0, 4), [events]);
  const visibleEvents = events;

  const handlePress = useCallback(
    (event) => navigation.navigate('EventDetail', { eventId: event.id }),
    [navigation],
  );

  const loadMoreHandler = useCallback(() => {
    if (hasMore && !isLoading) loadMore();
  }, [hasMore, isLoading, loadMore]);

  const getItemLayout = useCallback(
    (_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }),
    [],
  );

  const renderItem = useCallback(
    ({ item }) => <EventCard event={item} onPress={handlePress} />,
    [handlePress],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Etkinlik, topluluk veya ders ara..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setFilters({ search: text });
            }}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <FilterChipRow style={styles.chipSection}>
          <FilterChip
            label="Tumu"
            icon={CATEGORY_ICONS.Tumu}
            active={!filters.category}
            onPress={() => {
              setFilters({ category: null });
            }}
            colors={colors}
          />
          {EVENT_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              icon={CATEGORY_ICONS[cat]}
              active={filters.category === cat}
              onPress={() => {
                setFilters({ category: cat });
              }}
              colors={colors}
            />
          ))}
        </FilterChipRow>

        <FilterChipRow style={styles.chipSection}>
          {DATE_FILTERS.map((d) => (
            <FilterChip
              key={d.key}
              label={d.label}
              compact
              active={filters.dateRange === d.key}
              onPress={() => {
                setFilters({ dateRange: filters.dateRange === d.key ? null : d.key });
              }}
              colors={colors}
            />
          ))}
        </FilterChipRow>

        {featured.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>One Cikanlar</Text>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Tumunu Gor</Text>
            </View>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredRow}
            >
              {featured.map((event) => (
                <Pressable key={event.id} onPress={() => handlePress(event)} style={styles.featuredCard}>
                  {event.coverURL ? (
                    <Image source={{ uri: event.coverURL }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
                  )}
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>{event.category}</Text>
                  </View>
                  <View style={styles.featuredContent}>
                    <View style={styles.featuredMetaRow}>
                      <Ionicons name="calendar-outline" size={12} color="#fff" />
                      <Text style={styles.featuredDate}>{formatDate(event.startDate)}</Text>
                    </View>
                    <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.sm }]}>
          Yaklasan Etkinlikler
        </Text>
      </View>
    ),
    [colors, search, filters, featured, handlePress, setFilters],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader onNotificationPress={() => navigation.navigate('ProfileTab', { screen: 'Notifications' })} />

      {isLoading && events.length === 0 ? (
        <View style={styles.loadingWrap}>
          {listHeader}
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={visibleEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<EmptyState title="Henuz etkinlik yok" subtitle="+ ile etkinlik olustur" />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          initialNumToRender={FLAT_LIST.INITIAL_NUM}
          windowSize={FLAT_LIST.WINDOW_SIZE}
          maxToRenderPerBatch={FLAT_LIST.PAGE_SIZE}
          getItemLayout={getItemLayout}
          onEndReached={loadMoreHandler}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refreshEvents()}
            />
          }
        />
      )}

      <Pressable onPress={() => navigation.navigate('CreateEvent')} style={styles.fab}>
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
  listContent: { flexGrow: 1, paddingBottom: 100, paddingHorizontal: SPACING.md },
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
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  seeAll: { fontSize: 13, fontWeight: '700' },
  featuredRow: { gap: SPACING.md, paddingBottom: SPACING.md },
  featuredCard: { borderRadius: RADIUS.lg, height: 175, overflow: 'hidden', width: 270 },
  featuredBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  featuredBadgeText: { color: '#4F46E5', fontSize: 11, fontWeight: '800' },
  featuredContent: { bottom: 0, left: 0, padding: SPACING.md, position: 'absolute', right: 0 },
  featuredMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  featuredDate: { color: '#fff', fontSize: 12, fontWeight: '600' },
  featuredTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 6 },
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
