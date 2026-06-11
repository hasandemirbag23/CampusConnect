import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import AppHeader from '../../components/AppHeader';
import ChatItem from '../../components/ChatItem';
import EmptyState from '../../components/EmptyState';
import { FilterChip, FilterChipRow } from '../../components/FilterChipRow';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants';

const FILTERS = ['Tumu', 'Okunmamis'];

export default function ChatListScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { chats } = useChat();
  const [filter, setFilter] = useState('Tumu');
  const [search, setSearch] = useState('');

  const getOtherName = useCallback(
    (chat) => {
      const otherId = chat.participants?.find((id) => id !== user?.uid);
      return chat.participantInfo?.[otherId]?.displayName || 'Kullanici';
    },
    [user],
  );

  const visible = useMemo(() => {
    let result = chats;
    if (filter === 'Okunmamis') result = result.filter((c) => (c.unreadCount?.[user?.uid] || 0) > 0);
    if (search) result = result.filter((c) => getOtherName(c).toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [chats, filter, search, user, getOtherName]);

  const handlePress = useCallback(
    (chat) => navigation.navigate('ChatDetail', { chatId: chat.id, title: getOtherName(chat) }),
    [navigation, getOtherName],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader onNotificationPress={() => navigation.navigate('ProfileTab', { screen: 'Notifications' })} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Mesajlar</Text>

        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Sohbetlerde ara..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <FilterChipRow style={styles.chipSection}>
          {FILTERS.map((f) => (
            <FilterChip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} colors={colors} />
          ))}
        </FilterChipRow>

        {visible.length === 0 ? (
          <EmptyState title="Henuz mesaj yok" subtitle="Market ilanindan mesaj gonderin" />
        ) : (
          visible.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              name={getOtherName(chat)}
              unread={chat.unreadCount?.[user?.uid] || 0}
              onPress={() => handlePress(chat)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingHorizontal: SPACING.md },
  pageTitle: { fontSize: 26, fontWeight: '800', marginBottom: SPACING.md },
  search: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chipSection: { marginBottom: SPACING.md },
});
