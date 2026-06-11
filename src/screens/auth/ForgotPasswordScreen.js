import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants';
import { authInputStyle } from './authInputStyles';
import { showAlert } from '../../utils';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email) {
      showAlert('Hata', 'Email zorunlu');
      return;
    }

    try {
      await forgotPassword(email.trim());
      showAlert('Basarili', 'Sifre sifirlama linki gonderildi');
    } catch (error) {
      showAlert('Hata', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Sifre Sifirla</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        style={[authInputStyle.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
        value={email}
        onChangeText={setEmail}
      />
      <Pressable onPress={handleReset} style={[authInputStyle.button, { backgroundColor: colors.primary }]}>
        <Text style={authInputStyle.buttonText}>Link Gonder</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: SPACING.lg },
});
