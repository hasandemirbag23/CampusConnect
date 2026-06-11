import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants';
import { trackEvent } from '../../services/analyticsService';
import { isValidEmail, showAlert, getFirebaseErrorMessage } from '../../utils';

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const { register, loginGoogle, googleLoading, isGoogleReady } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    if (!displayName || !email || !password) {
      setError('Tum alanlar zorunlu');
      showAlert('Hata', 'Tum alanlar zorunlu');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError('Gecerli bir email girin');
      showAlert('Hata', 'Gecerli bir email girin');
      return;
    }

    if (password.length < 6) {
      setError('Sifre en az 6 karakter olmali');
      showAlert('Hata', 'Sifre en az 6 karakter olmali');
      return;
    }

    try {
      setLoading(true);
      await register(email.trim(), password, displayName.trim());
      trackEvent('user_registered');
      showAlert('Basarili', 'Hesabin olusturuldu. Profilini tamamla.');
    } catch (err) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      showAlert('Kayit basarisiz', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginGoogle();
      trackEvent('user_registered_google');
    } catch (err) {
      showAlert('Google Giris', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ color: colors.primary }}>← Geri</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>Kayit Ol</Text>

        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

        <TextInput
          placeholder="Ad Soyad"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Sifre (min 6 karakter)"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          disabled={loading}
          onPress={handleRegister}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: loading || pressed ? 0.8 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kayit Ol</Text>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={{ color: colors.textMuted, marginHorizontal: 12 }}>veya</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          onPress={handleGoogle}
          disabled={loading || googleLoading || !isGoogleReady}
          style={[
            styles.googleBtn,
            { borderColor: colors.border, backgroundColor: colors.card, opacity: isGoogleReady ? 1 : 0.5 },
          ]}
        >
          <Ionicons name="logo-google" size={20} color="#EA4335" />
          <Text style={[styles.googleText, { color: colors.text }]}>
            {googleLoading ? 'Google ile baglaniyor...' : 'Google ile Kayit Ol'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingTop: 60,
  },
  back: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },
  error: {
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  button: {
    alignItems: 'center',
    borderRadius: 10,
    marginTop: SPACING.sm,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: { alignItems: 'center', flexDirection: 'row', marginVertical: SPACING.lg },
  line: { flex: 1, height: 1 },
  googleBtn: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  googleText: { fontSize: 15, fontWeight: '600' },
});
