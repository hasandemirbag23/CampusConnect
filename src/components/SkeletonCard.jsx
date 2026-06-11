import { memo, useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants';

function SkeletonCard() {
  const { colors, isDark } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const baseColor = isDark ? colors.border : '#E2E8F0';

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, animatedStyle]}>
      <View style={[styles.image, { backgroundColor: baseColor }]} />
      <View style={[styles.line, { backgroundColor: baseColor, width: '70%' }]} />
      <View style={[styles.line, { backgroundColor: baseColor, width: '45%' }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    padding: SPACING.md,
  },
  image: {
    borderRadius: 8,
    height: 120,
    marginBottom: SPACING.sm,
  },
  line: {
    borderRadius: 4,
    height: 12,
    marginBottom: SPACING.sm,
  },
});

export default memo(SkeletonCard);
