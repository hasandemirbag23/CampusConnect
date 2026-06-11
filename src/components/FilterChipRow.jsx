import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { RADIUS } from '../constants';

export function FilterChipRow({ children, style }) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={[styles.row, style]}
      contentContainerStyle={styles.rowContent}
    >
      {children}
    </ScrollView>
  );
}

export function FilterChip({ label, icon, active, onPress, colors, compact }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        compact && styles.chipCompact,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={active ? '#fff' : colors.textSecondary} />
      ) : null}
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0, flexShrink: 0 },
  rowContent: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipCompact: { paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: '600' },
});
