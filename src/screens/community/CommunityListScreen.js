import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import CommunityCard from '../../components/CommunityCard';
import EmptyState from '../../components/EmptyState';
import { FilterChip, FilterChipRow } from '../../components/FilterChipRow';
import GradientHeader from '../../components/GradientHeader';
import SkeletonCard from '../../components/SkeletonCard';
import { useCommunity } from '../../context/CommunityContext';
import { useTheme } from '../../context/ThemeContext';
import { COMMUNITY_CATEGORIES, RADIUS, SPACING } from '../../constants';

export default function CommunityListScreen({ navigation }) {
  const { colors } = useTheme();
  const { communities, joinedCommunities, isLoading } = useCommunity();
  const [tab, setTab] = useState('discover');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(null);
  const [sortByMembers, setSortByMembers] = useState(true);

  const list = tab === 'joined' ? joinedCommunities : communities;

  const filtered = useMemo(() => {
    let result = list;
    if (category) result = result.filter((c) => c.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name?.toLowerCase().includes(q));
    }
    if (sortByMembers) {
      result = [...result].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
    }
    return result;
  }, [list, category, search, sortByMembers]);

  const handlePress = useCallback(
    (community) => navigation.navigate('CommunityDetail', { communityId: community.id }),
    [navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader title="Topluluklar" subtitle="Kampusteki gruplari kesfet" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => {}} />}
      >
        <View style={styles.tabs}>
          <TabBtn label="Keşfet" active={tab === 'discover'} onPress={() => setTab('discover')} colors={colors} />
          <TabBtn label="Katıldıklarım" active={tab === 'joined'} onPress={() => setTab('joined')} colors={colors} />
        </View>

        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Topluluk ara..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={{ color: colors.text, flex: 1, marginLeft: 8 }}
          />
          <Pressable onPress={() => setSortByMembers((v) => !v)}>
            <Ionicons name="people" size={20} color={sortByMembers ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>

        <FilterChipRow style={styles.chipSection}>
          <FilterChip label="Tumu" active={!category} onPress={() => setCategory(null)} colors={colors} />
          {COMMUNITY_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={category === cat}
              onPress={() => setCategory(category === cat ? null : cat)}
              colors={colors}
            />
          ))}
        </FilterChipRow>

        {isLoading && filtered.length === 0 ? (
          <SkeletonCard />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tab === 'joined' ? 'Henüz hiç topluluğa katılmadınız' : 'Henüz topluluk yok'}
            subtitle={tab === 'joined' ? 'Keşfet sekmesinden topluluklara katılın' : '+ ile topluluk oluştur'}
          />
        ) : (
          filtered.map((c) => <CommunityCard key={c.id} community={c} onPress={handlePress} />)
        )}
      </ScrollView>

      <Pressable onPress={() => navigation.navigate('CreateCommunity')} style={styles.fab}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.fabInner}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function TabBtn({ label, active, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabBtn, { backgroundColor: active ? colors.primary : colors.card, borderColor: colors.border }]}
    >
      <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  tabs: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  tabBtn: { borderRadius: RADIUS.full, borderWidth: 1, flex: 1, paddingVertical: 10, alignItems: 'center' },
  search: { alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row', marginBottom: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  chipSection: { marginBottom: SPACING.sm },
  fab: { borderRadius: 28, bottom: SPACING.lg, height: 56, position: 'absolute', right: SPACING.lg, width: 56 },
  fabInner: { alignItems: 'center', borderRadius: 28, flex: 1, justifyContent: 'center' },
});
