import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LikeButton({ liked, count, onToggle, color = '#EF4444', size = 20 }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (liked) {
      scale.value = withSequence(withSpring(1.3, { damping: 8 }), withSpring(1, { damping: 10 }));
    }
  }, [liked, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable onPress={onToggle} style={[styles.row, animStyle]}>
      <Ionicons name={liked ? 'heart' : 'heart-outline'} size={size} color={color} />
      {count != null ? (
        <Text style={[styles.count, { color }]}>{count}</Text>
      ) : null}
    </AnimatedPressable>
  );
}

export default memo(LikeButton);

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  count: { fontSize: 14, fontWeight: '600' },
});
