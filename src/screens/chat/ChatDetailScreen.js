import { useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatInput from '../../components/ChatInput';
import MessageBubble from '../../components/MessageBubble';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants';
import { uploadChatImage } from '../../services/storageService';
import { showAlert } from '../../utils';

export default function ChatDetailScreen({ route, navigation }) {
  const { chatId, title } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const { messages, openChat, sendMessage, sendImage } = useChat();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    openChat({ id: chatId });
  }, [chatId, openChat]);

  const handleSend = useCallback(
    async (text) => {
      try {
        await sendMessage(text);
      } catch (e) {
        showAlert('Hata', e.message);
      }
    },
    [sendMessage],
  );

  const handleSendImage = useCallback(
    async (uri) => {
      try {
        const imageURL = await uploadChatImage(chatId, uri);
        await sendImage(imageURL);
      } catch (e) {
        showAlert('Hata', e.message);
      }
    },
    [chatId, sendImage],
  );

  const renderItem = useCallback(
    ({ item }) => <MessageBubble message={item} isOwn={item.senderId === user?.uid} />,
    [user],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + SPACING.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.avatar}>
          <Text style={styles.avatarText}>{(title || 'S')[0]?.toUpperCase()}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{title || 'Sohbet'}</Text>
          <Text style={[styles.status, { color: colors.success }]}>Cevrimici</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
        removeClippedSubviews
        initialNumToRender={15}
        windowSize={7}
      />
      <ChatInput onSend={handleSend} onSendImage={handleSendImage} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: SPACING.sm, paddingBottom: SPACING.sm, paddingHorizontal: SPACING.md },
  avatar: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700' },
  status: { fontSize: 12, marginTop: 1 },
});
