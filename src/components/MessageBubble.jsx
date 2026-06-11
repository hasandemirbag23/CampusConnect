import { memo, useEffect } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants';
import { formatTime } from '../utils';

function MessageBubble({ message, isOwn }) {
  const { colors } = useTheme();
  const translateY = useSharedValue(12);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14, stiffness: 280 });
    opacity.value = withSpring(1, { damping: 14 });
  }, [message.id, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther, animStyle]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
        ]}
      >
        {message.imageURL ? (
          <Image source={{ uri: message.imageURL }} style={styles.image} contentFit="cover" />
        ) : null}
        {message.text ? (
          <Text style={[styles.text, { color: isOwn ? '#fff' : colors.text }]}>{message.text}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[styles.time, { color: isOwn ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>
            {formatTime(message.createdAt)}
          </Text>
          {isOwn ? (
            <Ionicons
              name={message.read ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={message.read ? '#A5F3FC' : 'rgba(255,255,255,0.75)'}
            />
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

export default memo(MessageBubble);

const styles = StyleSheet.create({
  row: { marginBottom: SPACING.sm, paddingHorizontal: SPACING.md },
  rowOwn: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  bubble: { borderRadius: RADIUS.lg, maxWidth: '80%', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  image: { borderRadius: RADIUS.md, height: 160, marginBottom: 6, width: 220 },
  text: { fontSize: 15, lineHeight: 21 },
  metaRow: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', gap: 4, marginTop: 4 },
  time: { fontSize: 10 },
});
