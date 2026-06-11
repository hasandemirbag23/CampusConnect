import { StyleSheet } from 'react-native';

import { RADIUS, SPACING } from '../../constants';

export const authDividerStyles = StyleSheet.create({
  dividerRow: { alignItems: 'center', flexDirection: 'row', marginVertical: SPACING.lg },
  line: { flex: 1, height: 1 },
  googleBtn: {
    alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row',
    gap: 10, justifyContent: 'center', paddingVertical: 14,
  },
  googleText: { fontSize: 15, fontWeight: '600' },
});
