import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import EventCard from '../../components/EventCard';
import ListingCard from '../../components/ListingCard';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { useMarket } from '../../context/MarketContext';
import { useTheme } from '../../context/ThemeContext';
import { useLogout } from '../../hooks/useLogout';
import { RADIUS, SHADOW, SPACING } from '../../constants';

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const logout = useLogout();
  const { myEvents, joinedEvents, savedEvents } = useEvents();
  const { myListings } = useMarket();
  const [tab, setTab] = useState('events');

  const menuItems = [
    { icon: 'create-outline', label: 'Profili Duzenle', screen: 'EditProfile' },
    { icon: 'notifications-outline', label: 'Bildirimler', screen: 'Notifications' },
    { icon: 'settings-outline', label: 'Ayarlar', screen: 'Settings' },
  ];

  const tabData = {
    events: myEvents,
    joined: joinedEvents,
    saved: savedEvents,
    listings: myListings,
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
        {profile?.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{profile?.displayName?.[0] || '?'}</Text>
          </View>
        )}
        <Text style={styles.name}>{profile?.displayName || user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {profile?.department ? (
          <View style={styles.deptBadge}>
            <Ionicons name="school-outline" size={14} color="#fff" />
            <Text style={styles.deptText}>{profile.department} · {profile.year}. sinif</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={[styles.statsRow, { marginTop: -24 }]}>
        <StatBox label="Takipci" value={profile?.followersCount || 0} colors={colors} />
        <StatBox label="Takip" value={profile?.followingCount || 0} colors={colors} />
        <StatBox label="Ilgi" value={profile?.interests?.length || 0} colors={colors} />
      </View>

      {profile?.bio ? (
        <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
      ) : null}

      <View style={styles.tabs}>
        <TabBtn label="Olusturdugum" active={tab === 'events'} onPress={() => setTab('events')} colors={colors} />
        <TabBtn label="Katildigim" active={tab === 'joined'} onPress={() => setTab('joined')} colors={colors} />
        <TabBtn label="Kaydedilen" active={tab === 'saved'} onPress={() => setTab('saved')} colors={colors} />
        <TabBtn label="Ilanlar" active={tab === 'listings'} onPress={() => setTab('listings')} colors={colors} />
      </View>

      <View style={styles.tabContent}>
        {tab === 'listings' ? (
          tabData.listings.length === 0 ? (
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Henuz ilan yok</Text>
          ) : (
            tabData.listings.map((item) => (
              <ListingCard key={item.id} listing={item} onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })} />
            ))
          )
        ) : tabData[tab].length === 0 ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Henuz icerik yok</Text>
        ) : (
          tabData[tab].map((event) => (
            <EventCard key={event.id} event={event} onPress={() => navigation.navigate('EventDetail', { eventId: event.id })} />
          ))
        )}
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <Pressable key={item.screen} onPress={() => navigation.navigate(item.screen)}
            style={[styles.menuItem, SHADOW.card, { backgroundColor: colors.card }]}>
            <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable onPress={logout} style={[styles.logout, { borderColor: colors.error }]}>
        <Text style={{ color: colors.error, fontWeight: '700' }}>Cikis Yap</Text>
      </Pressable>
    </ScrollView>
  );
}

function TabBtn({ label, active, onPress, colors }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, { borderBottomColor: active ? colors.primary : 'transparent' }]}>
      <Text style={{ color: active ? colors.primary : colors.textMuted, fontWeight: '700', fontSize: 11 }}>{label}</Text>
    </Pressable>
  );
}

function StatBox({ label, value, colors }) {
  return (
    <View style={[styles.stat, SHADOW.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingBottom: SPACING.xl, paddingTop: SPACING.xl * 2 },
  avatar: { borderRadius: 48, height: 96, width: 96 },
  avatarPlaceholder: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 48, height: 96, justifyContent: 'center', width: 96 },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: SPACING.md },
  email: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
  deptBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, flexDirection: 'row', gap: 6, marginTop: SPACING.sm, paddingHorizontal: 12, paddingVertical: 6 },
  deptText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md },
  stat: { alignItems: 'center', borderRadius: RADIUS.lg, flex: 1, paddingVertical: SPACING.md },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  bio: { fontSize: 14, lineHeight: 20, marginHorizontal: SPACING.md, marginTop: SPACING.md, textAlign: 'center' },
  tabs: { borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.06)', flexDirection: 'row', marginHorizontal: SPACING.md, marginTop: SPACING.lg },
  tabBtn: { alignItems: 'center', borderBottomWidth: 2, flex: 1, paddingVertical: 10 },
  tabContent: { padding: SPACING.md },
  menu: { gap: SPACING.sm, padding: SPACING.md },
  menuItem: { alignItems: 'center', borderRadius: RADIUS.lg, flexDirection: 'row', padding: SPACING.md },
  menuIcon: { alignItems: 'center', borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', marginLeft: SPACING.sm },
  logout: { alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, margin: SPACING.md, marginBottom: 40, paddingVertical: 14 },
});
