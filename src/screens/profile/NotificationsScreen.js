import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import NotificationRow from '../../components/NotificationRow';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants';
import { trackEvent } from '../../services/analyticsService';
import { deleteNotification, markNotificationRead, subscribeToNotifications } from '../../services/userService';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeToNotifications(user.uid, setNotifications);
  }, [user]);

  const handleRead = useCallback(
    async (notif) => {
      trackEvent('notification_opened', { type: notif.type });
      if (!user || notif.read) return;
      await markNotificationRead(user.uid, notif.id);
    },
    [user],
  );

  const handleDelete = useCallback(
    async (notifId) => {
      if (!user) return;
      await deleteNotification(user.uid, notifId);
    },
    [user],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
        {notifications.length === 0 ? (
          <EmptyState title="Bildirim yok" subtitle="Yeni bildirimler burada gorunecek" />
        ) : (
          notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onPress={handleRead} onDelete={handleDelete} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
