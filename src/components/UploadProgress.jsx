import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants';

export default function UploadProgress({ progress, label = 'Yukleniyor...' }) {
  const { colors } = useTheme();
  const percent = Math.round((progress || 0) * 100);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label} %{percent}</Text>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.bar, { backgroundColor: colors.primary, width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  label: {
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  track: {
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
  },
});
