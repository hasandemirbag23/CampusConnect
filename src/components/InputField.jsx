import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants';

export default function InputField({ label, ...props }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    fontSize: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
});
