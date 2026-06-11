import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants';
import { trackEvent } from '../../services/analyticsService';
import { followUser, isFollowing, subscribeToUserProfile, unfollowUser } from '../../services/userService';
import { showAlert } from '../../utils';

export default function UserProfileScreen({ route }) {
  const { userId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToUserProfile(userId, setProfile);
    return unsub;
  }, [userId]);

  useEffect(() => {
    if (user) isFollowing(user.uid, userId).then(setFollowing);
  }, [userId, user]);

  const toggleFollow = async () => {
    if (!user) return;
    try {
      if (following) await unfollowUser(user.uid, userId);
      else {
        await followUser(user.uid, userId);
        trackEvent('user_followed', { target_id: userId });
      }
      setFollowing(!following);
    } catch (e) {
      showAlert('Hata', e.message);
    }
  };

  if (!profile) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  const isOwn = user?.uid === userId;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {profile.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{profile.displayName?.[0]}</Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]}>{profile.displayName}</Text>
        {profile.department ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{profile.department} · {profile.year}. sinif</Text>
        ) : null}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{profile.followersCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Takipci</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{profile.followingCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Takip</Text>
          </View>
        </View>
        {profile.bio ? <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text> : null}
        {!isOwn && (
          <Pressable onPress={toggleFollow} style={[styles.btn, { backgroundColor: following ? colors.border : colors.primary }]}>
            <Text style={{ color: following ? colors.text : '#fff', fontWeight: '700' }}>
              {following ? 'Takipten Cik' : 'Takip Et'}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: SPACING.lg },
  avatar: { borderRadius: 48, height: 96, width: 96 },
  avatarText: { fontSize: 36, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', marginTop: SPACING.md },
  meta: { fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.md },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  bio: { fontSize: 14, marginTop: SPACING.sm, textAlign: 'center' },
  btn: { borderRadius: RADIUS.md, marginTop: SPACING.md, paddingHorizontal: 24, paddingVertical: 12 },
});
