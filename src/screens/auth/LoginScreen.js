import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants';
import { authDividerStyles } from './authDividerStyles';
import { isValidEmail, showAlert, getFirebaseErrorMessage } from '../../utils';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const { login, loginGoogle, googleLoading, isGoogleReady } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Email ve sifre zorunlu');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Gecerli bir email girin');
      return;
    }
    if (password.length < 6) {
      setError('Sifre en az 6 karakter olmali');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      showAlert('Giris basarisiz', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginGoogle();
    } catch (err) {
      showAlert('Google Giris', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={[styles.hero, { paddingTop: insets.top + SPACING.lg }]}
      >
        <View style={styles.logoBox}>
          <Ionicons name="school" size={40} color="#fff" />
        </View>
        <Text style={styles.brand}>CampusConnect</Text>
        <Text style={styles.tagline}>Akademik dunyaya acilan kapi</Text>
      </LinearGradient>

      <ScrollView
        style={[styles.form, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

        <InputField label="Universite E-postasi" autoCapitalize="none" keyboardType="email-address"
          placeholder="ad.soyad@edu.tr" value={email} onChangeText={setEmail} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Sifre</Text>
        <View style={[styles.passRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
          <TextInput placeholder="••••••••" placeholderTextColor={colors.textMuted} secureTextEntry={!showPass}
            value={password} onChangeText={setPassword} style={[styles.passInput, { color: colors.text }]} />
          <Pressable onPress={() => setShowPass(!showPass)}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Sifremi Unuttum</Text>
        </Pressable>

        <PrimaryButton title="Giris Yap  →" onPress={handleLogin} loading={loading} />

        <View style={authDividerStyles.dividerRow}>
          <View style={[authDividerStyles.line, { backgroundColor: colors.border }]} />
          <Text style={{ color: colors.textMuted, marginHorizontal: 12 }}>veya</Text>
          <View style={[authDividerStyles.line, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          onPress={handleGoogle}
          disabled={loading || googleLoading || !isGoogleReady}
          style={[
            authDividerStyles.googleBtn,
            { borderColor: colors.border, backgroundColor: colors.card, opacity: isGoogleReady ? 1 : 0.5 },
          ]}
        >
          <Ionicons name="logo-google" size={20} color="#EA4335" />
          <Text style={[authDividerStyles.googleText, { color: colors.text }]}>
            {googleLoading ? 'Google ile baglaniyor...' : 'Google ile Devam Et'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.register}>
          <Text style={{ color: colors.textSecondary }}>
            Henuz hesabiniz yok mu? <Text style={{ color: colors.primary, fontWeight: '700' }}>Kayit Ol</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: 'center', paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
  logoBox: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    height: 72, justifyContent: 'center', marginBottom: SPACING.md, width: 72,
  },
  brand: { color: '#fff', fontSize: 28, fontWeight: '800' },
  tagline: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  form: { borderTopLeftRadius: 24, borderTopRightRadius: 24, flex: 1, marginTop: -20 },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  error: { marginBottom: SPACING.md, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: SPACING.xs },
  passRow: {
    alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row',
    gap: 8, marginBottom: SPACING.sm, paddingHorizontal: SPACING.md,
  },
  passInput: { flex: 1, fontSize: 16, paddingVertical: 14 },
  forgot: { alignSelf: 'flex-end', marginBottom: SPACING.lg },
  register: { alignItems: 'center', marginTop: SPACING.xl },
});
