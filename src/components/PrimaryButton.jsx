import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants';

export default function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary' }) {
  const { colors } = useTheme();
  const isOutline = variant === 'outline';

  if (isOutline) {
    return (
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        style={[styles.outline, { borderColor: colors.primary, opacity: disabled ? 0.5 : 1 }]}
      >
        <Text style={[styles.outlineText, { color: colors.primary }]}>{loading ? '...' : title}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={{ opacity: disabled ? 0.5 : 1 }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <Text style={styles.text}>{loading ? 'Yukleniyor...' : title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 16,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  outline: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingVertical: 15,
  },
  outlineText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
