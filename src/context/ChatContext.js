import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import { trackEvent } from '../services/analyticsService';
import {
  getOrCreateChat,
  markChatRead,
  sendMessage,
  subscribeToMessages,
  subscribeToUserChats,
} from '../services/chatService';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setChats([]);
      return undefined;
    }

    const unsubscribe = subscribeToUserChats(user.uid, (items) => {
      setChats(items);
      const total = items.reduce((sum, chat) => sum + (chat.unreadCount?.[user.uid] || 0), 0);
      setUnreadCount(total);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!activeChat?.id) {
      setMessages([]);
      return undefined;
    }

    const unsubscribe = subscribeToMessages(activeChat.id, setMessages);
    if (user) markChatRead(activeChat.id, user.uid);
    return unsubscribe;
  }, [activeChat?.id, user]);

  const openChat = useCallback((chat) => {
    setActiveChat(chat);
  }, []);

  const markAsRead = useCallback(
    async (chatId) => {
      if (!user) return;
      await markChatRead(chatId || activeChat?.id, user.uid);
    },
    [user, activeChat],
  );

  const startChat = useCallback(
    async (otherUserId, otherUser, currentUser) => {
      if (!user) throw new Error('Giris gerekli');
      const chatId = await getOrCreateChat(user.uid, otherUserId, otherUser, currentUser);
      return chatId;
    },
    [user],
  );

  const handleSendMessage = useCallback(
    async (text, imageURL = '') => {
      if (!user || !activeChat?.id) throw new Error('Sohbet secilmedi');
      await sendMessage(activeChat.id, user.uid, text, imageURL);
      trackEvent('message_sent', { chat_id: activeChat.id });
    },
    [user, activeChat],
  );

  const handleSendImage = useCallback(
    async (imageURL) => {
      if (!user || !activeChat?.id) throw new Error('Sohbet secilmedi');
      await sendMessage(activeChat.id, user.uid, '', imageURL);
      trackEvent('message_sent', { chat_id: activeChat.id, type: 'image' });
    },
    [user, activeChat],
  );

  const reset = useCallback(() => {
    setChats([]);
    setActiveChat(null);
    setMessages([]);
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      chats,
      activeChat,
      messages,
      unreadCount,
      openChat,
      startChat,
      sendMessage: handleSendMessage,
      sendImage: handleSendImage,
      markAsRead,
      reset,
    }),
    [chats, activeChat, messages, unreadCount, openChat, startChat, handleSendMessage, handleSendImage, markAsRead, reset],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat ChatProvider icinde kullanilmali');
  return context;
}
