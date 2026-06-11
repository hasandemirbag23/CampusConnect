import { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import AnimatedTabBadge from '../components/AnimatedTabBadge';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { subscribeToNotifications } from '../services/userService';
import ChatStack from './ChatStack';
import CommunityStack from './CommunityStack';
import DiscoverStack from './DiscoverStack';
import MarketStack from './MarketStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  DiscoverTab: ['compass', 'compass-outline'],
  CommunityTab: ['people', 'people-outline'],
  MarketTab: ['bag', 'bag-outline'],
  ChatTab: ['chatbox', 'chatbox-outline'],
  ProfileTab: ['person', 'person-outline'],
};

const TAB_LABELS = {
  DiscoverTab: 'Discover',
  CommunityTab: 'Community',
  MarketTab: 'Market',
  ChatTab: 'Messages',
  ProfileTab: 'Profile',
};

export default function MainTabNavigator() {
  const { colors } = useTheme();
  const { unreadCount } = useChat();
  const { user } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadNotifs(0);
      return undefined;
    }
    return subscribeToNotifications(user.uid, (items) => {
      setUnreadNotifs(items.filter((n) => !n.read).length);
    });
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 0,
          elevation: 12,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons[0] : icons[1];
          const badgeCount =
            route.name === 'ChatTab' ? unreadCount : route.name === 'ProfileTab' ? unreadNotifs : 0;
          return (
            <View>
              <Ionicons name={name} size={size} color={color} />
              {badgeCount > 0 ? <AnimatedTabBadge count={badgeCount} /> : null}
            </View>
          );
        },
        tabBarLabel: TAB_LABELS[route.name],
      })}
    >
      <Tab.Screen name="DiscoverTab" component={DiscoverStack} />
      <Tab.Screen name="CommunityTab" component={CommunityStack} />
      <Tab.Screen name="MarketTab" component={MarketStack} />
      <Tab.Screen name="ChatTab" component={ChatStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}
