import { useCallback } from 'react';

import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCommunity } from '../context/CommunityContext';
import { useEvents } from '../context/EventContext';
import { useMarket } from '../context/MarketContext';
import { useTheme } from '../context/ThemeContext';

export function useLogout() {
  const { logout } = useAuth();
  const { reset: resetEvents } = useEvents();
  const { reset: resetCommunity } = useCommunity();
  const { reset: resetMarket } = useMarket();
  const { reset: resetChat } = useChat();
  const { resetTheme } = useTheme();

  return useCallback(async () => {
    resetEvents();
    resetCommunity();
    resetMarket();
    resetChat();
    await logout();
    await resetTheme();
  }, [logout, resetEvents, resetCommunity, resetMarket, resetChat, resetTheme]);
}
