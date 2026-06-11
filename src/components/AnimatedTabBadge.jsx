import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

export default function AnimatedTabBadge({ count, color = '#EF4444' }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 400 }),
        withSpring(1, { damping: 8, stiffness: 300 }),
      );
    }
  }, [count, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!count || count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, { backgroundColor: color }, animStyle]}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -6,
    top: -4,
  },
  text: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
