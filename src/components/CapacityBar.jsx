import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants';

export default function CapacityBar({ current = 0, max = 100, label }) {
  const { colors } = useTheme();
  const pct = max ? Math.min(100, (current / max) * 100) : 0;
  const isFull = max && current >= max;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label || 'Kapasite'}</Text>
        <Text style={[styles.count, { color: isFull ? colors.warning : colors.text }]}>
          {current}/{max || '∞'}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              backgroundColor: isFull ? colors.warning : colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 13, fontWeight: '700' },
  track: { borderRadius: RADIUS.full, height: 8, overflow: 'hidden' },
  fill: { borderRadius: RADIUS.full, height: '100%' },
});
