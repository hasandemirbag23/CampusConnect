import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants';
import { formatDate } from '../utils';

const NOTIF_ICONS = {
  event_join: 'calendar',
  event_reminder: 'alarm',
  follow: 'person-add',
  post_like: 'heart',
  message: 'chatbubble',
};

function NotificationRow({ notification, onPress, onDelete }) {
  const { colors } = useTheme();
  const height = useSharedValue(72);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  const dismiss = () => {
    height.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onDelete)(notification.id);
    });
    opacity.value = withTiming(0, { duration: 200 });
  };

  const renderRight = () => (
    <RectButton onPress={dismiss} style={[styles.deleteBtn, { backgroundColor: colors.error }]}>
      <Ionicons name="trash-outline" size={22} color="#fff" />
    </RectButton>
  );

  return (
    <Animated.View style={animStyle}>
      <Swipeable renderRightActions={renderRight} overshootRight={false}>
        <Pressable
          onPress={() => onPress(notification)}
          style={[styles.item, { backgroundColor: notification.read ? colors.card : colors.primaryLight }]}
        >
          <View style={[styles.icon, { backgroundColor: colors.primary }]}>
            <Ionicons name={NOTIF_ICONS[notification.type] || 'notifications'} size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.body, { color: colors.text }]}>{notification.text || notification.type}</Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(notification.createdAt)}</Text>
          </View>
          {!notification.read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

export default memo(NotificationRow);

const styles = StyleSheet.create({
  item: { alignItems: 'center', borderRadius: RADIUS.lg, flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.md },
  icon: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  body: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 12, marginTop: 4 },
  dot: { borderRadius: 4, height: 8, width: 8 },
  deleteBtn: { alignItems: 'center', borderRadius: RADIUS.lg, justifyContent: 'center', marginBottom: SPACING.sm, width: 72 },
});
