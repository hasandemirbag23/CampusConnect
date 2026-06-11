import { StyleSheet } from 'react-native';

import { SPACING } from '../../constants';

export const authInputStyle = StyleSheet.create({
  input: {
    borderWidth: 1, borderRadius: 10, marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  button: { alignItems: 'center', borderRadius: 10, paddingVertical: 14 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
