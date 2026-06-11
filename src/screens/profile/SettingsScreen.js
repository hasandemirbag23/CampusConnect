import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useLogout } from '../../hooks/useLogout';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants';
import { deleteAccount } from '../../services/authService';
import { deleteToken, registerForPushNotifications } from '../../services/notificationService';
import { showAlert, showConfirm } from '../../utils';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, profile, updateProfile } = useAuth();
  const logout = useLogout();

  const prefs = profile?.notificationPrefs || { events: true, messages: true, communities: false };
  const [events, setEvents] = useState(prefs.events);
  const [messages, setMessages] = useState(prefs.messages);
  const [communities, setCommunities] = useState(prefs.communities);
  const [pushEnabled, setPushEnabled] = useState(Boolean(profile?.fcmToken));

  const savePrefs = (next) => {
    updateProfile({ notificationPrefs: { events, messages, communities, ...next } }).catch(() => {});
  };

  const togglePush = async (value) => {
    setPushEnabled(value);
    try {
      if (value) await registerForPushNotifications(user?.uid);
      else await deleteToken(user?.uid);
    } catch (e) {
      showAlert('Bildirim', e.message);
    }
  };

  const handleDelete = () => {
    showConfirm('Hesabi Sil', 'Hesabin ve tum verilerin kalici olarak silinecek. Emin misin?', async () => {
      try {
        await deleteAccount();
      } catch (e) {
        showAlert('Hata', e.message?.includes('recent') ? 'Guvenlik icin tekrar giris yapip dene.' : e.message);
      }
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: SPACING.md }}>
      <View style={[styles.userCard, { backgroundColor: colors.primaryLight }]}>
        {profile?.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{profile?.displayName?.[0] || '?'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: colors.text }]}>{profile?.displayName || 'Kullanici'}</Text>
          <Text style={[styles.userMeta, { color: colors.textSecondary }]}>
            {profile?.department || 'Bolum yok'}{profile?.year ? `, ${profile.year}. Sinif` : ''}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>GORUNUM</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Row icon="moon" iconBg={colors.primaryLight} iconColor={colors.primary} label="Karanlik Tema" colors={colors}
          right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.primary }} thumbColor="#fff" />} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>BILDIRIM AYARLARI</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Row icon="calendar" iconBg="#E0F2FE" iconColor="#0284C7" label="Etkinlikler" sub="Yeni kampus etkinlikleri ve guncellemeler" colors={colors}
          right={<Switch value={events} onValueChange={(v) => { setEvents(v); savePrefs({ events: v }); }} trackColor={{ true: colors.primary }} thumbColor="#fff" />} divider />
        <Row icon="chatbubble" iconBg="#EEF2FF" iconColor={colors.primary} label="Mesajlar" sub="Arkadaslarindan gelen yeni mesajlar" colors={colors}
          right={<Switch value={messages} onValueChange={(v) => { setMessages(v); savePrefs({ messages: v }); }} trackColor={{ true: colors.primary }} thumbColor="#fff" />} divider />
        <Row icon="people" iconBg="#FCE7F3" iconColor="#DB2777" label="Topluluklar" sub="Uye oldugun topluluklardaki paylasimlar" colors={colors}
          right={<Switch value={communities} onValueChange={(v) => { setCommunities(v); savePrefs({ communities: v }); }} trackColor={{ true: colors.primary }} thumbColor="#fff" />} divider />
        <Row icon="notifications" iconBg="#FEF3C7" iconColor="#D97706" label="Push Bildirimleri" sub="Cihaza anlik bildirim gonder" colors={colors}
          right={<Switch value={pushEnabled} onValueChange={togglePush} trackColor={{ true: colors.primary }} thumbColor="#fff" />} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>YASAL</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <LinkRow icon="shield-checkmark-outline" label="Gizlilik Politikasi" colors={colors} onPress={() => {}} divider />
        <LinkRow icon="document-text-outline" label="Kullanim Kosullari" colors={colors} onPress={() => {}} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HESAP ISLEMLERI</Text>
      <Pressable onPress={logout} style={[styles.actionBtn, { backgroundColor: colors.card }]}>
        <Ionicons name="log-out-outline" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>Cikis Yap</Text>
      </Pressable>
      <Pressable onPress={handleDelete} style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}>
        <Ionicons name="close-circle-outline" size={20} color={colors.error} />
        <Text style={[styles.actionText, { color: colors.error }]}>Hesabi Sil</Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.textMuted }]}>CampusConnect v2.4.1{'\n'}© 2024 Akademik Yazilim Ltd.</Text>
    </ScrollView>
  );
}

function Row({ icon, iconBg, iconColor, label, sub, right, colors, divider }) {
  return (
    <View style={[styles.row, divider && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {sub ? <Text style={[styles.rowSub, { color: colors.textMuted }]}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function LinkRow({ icon, label, colors, onPress, divider }) {
  return (
    <Pressable onPress={onPress} style={[styles.row, divider && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  userCard: { alignItems: 'center', borderRadius: RADIUS.lg, flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg, padding: SPACING.md },
  avatar: { borderRadius: 28, height: 56, width: 56 },
  userName: { fontSize: 17, fontWeight: '800' },
  userMeta: { fontSize: 13, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.md },
  card: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  row: { alignItems: 'center', flexDirection: 'row', gap: SPACING.md, padding: SPACING.md },
  rowIcon: { alignItems: 'center', borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  actionBtn: { alignItems: 'center', borderRadius: RADIUS.lg, flexDirection: 'row', gap: SPACING.sm, justifyContent: 'center', marginBottom: SPACING.sm, paddingVertical: 16 },
  actionText: { fontSize: 16, fontWeight: '700' },
  version: { fontSize: 12, marginTop: SPACING.lg, textAlign: 'center' },
});
