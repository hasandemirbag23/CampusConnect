import { useCallback, useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import PostCard from '../../components/PostCard';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SHADOW, SPACING } from '../../constants';
import {
  getMemberRole,
  isCommunityMember,
  removeMember,
  setMemberRole,
  subscribeToCommunity,
  subscribeToMembers,
} from '../../services/communityService';
import { uploadPostImage } from '../../services/storageService';
import { showAlert, showConfirm } from '../../utils';

export default function CommunityDetailScreen({ route, navigation }) {
  const { communityId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const { posts, subscribePosts, joinCommunity, leaveCommunity, createPost } = useCommunity();
  const [community, setCommunity] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [postText, setPostText] = useState('');
  const [postImageUri, setPostImageUri] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const unsub = subscribeToCommunity(communityId, setCommunity);
    return unsub;
  }, [communityId]);

  useEffect(() => {
    const unsub = subscribePosts(communityId);
    return unsub;
  }, [communityId, subscribePosts]);

  useEffect(() => {
    if (!user) return;
    isCommunityMember(communityId, user.uid).then(setIsMember);
    getMemberRole(communityId, user.uid).then(setUserRole);
  }, [communityId, user, posts.length]);

  useEffect(() => {
    if (!membersOpen) return undefined;
    const unsub = subscribeToMembers(communityId, setMembers);
    return unsub;
  }, [communityId, membersOpen]);

  const isAdmin = useMemo(
    () => userRole === 'admin' || community?.creatorId === user?.uid,
    [userRole, community?.creatorId, user?.uid],
  );

  const toggleJoin = async () => {
    try {
      if (isMember) await leaveCommunity(communityId);
      else await joinCommunity(communityId);
      setIsMember(!isMember);
    } catch (e) {
      showAlert('Hata', e.message);
    }
  };

  const pickPostImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPostImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!postText.trim() && !postImageUri) return;
    try {
      setSubmitting(true);
      let imageURLs = [];
      if (postImageUri) {
        const url = await uploadPostImage(communityId, postImageUri);
        imageURLs = [url];
      }
      await createPost(communityId, postText.trim(), imageURLs);
      setPostText('');
      setPostImageUri('');
    } catch (e) {
      showAlert('Hata', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = (memberId) => {
    showConfirm('Uye Cikar', 'Bu uyeyi topluluktan cikarmak istiyor musun?', async () => {
      try {
        await removeMember(communityId, memberId);
      } catch (e) {
        showAlert('Hata', e.message);
      }
    });
  };

  const handleSetModerator = async (memberId) => {
    try {
      await setMemberRole(communityId, memberId, 'moderator');
    } catch (e) {
      showAlert('Hata', e.message);
    }
  };

  const handlePostPress = useCallback(
    (post) => navigation.navigate('PostDetail', { communityId, postId: post.id }),
    [navigation, communityId],
  );

  if (!community) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {community.coverURL ? (
          <Image source={{ uri: community.coverURL }} style={styles.cover} contentFit="cover" />
        ) : (
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.cover} />
        )}

        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <View style={styles.headerBody}>
          {community.iconURL ? (
            <Image source={{ uri: community.iconURL }} style={[styles.iconBox, styles.iconImage, { borderColor: colors.background }]} contentFit="cover" />
          ) : (
            <View style={[styles.iconBox, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="people" size={28} color="#fff" />
            </View>
          )}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{community.name}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{(community.category || '').toUpperCase()}</Text>
                </View>
                {community.isPrivate ? (
                  <View style={[styles.badge, { backgroundColor: colors.border }]}>
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>OZEL</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Pressable onPress={toggleJoin} style={[styles.joinBtn, { backgroundColor: isMember ? colors.border : colors.primary }]}>
              <Text style={{ color: isMember ? colors.text : '#fff', fontWeight: '700' }}>{isMember ? 'Ayril' : 'Katil'}</Text>
            </Pressable>
          </View>

          <Text style={[styles.desc, { color: colors.textSecondary }]}>{community.description}</Text>

          {community.tags?.length > 0 ? (
            <View style={styles.tagRow}>
              {community.tags.map((tag) => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {community.rules?.length > 0 ? (
            <View style={[styles.rulesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.rulesTitle, { color: colors.text }]}>Kurallar</Text>
              {community.rules.map((rule, i) => (
                <Text key={`${i}-${rule}`} style={[styles.ruleItem, { color: colors.textSecondary }]}>
                  {i + 1}. {rule}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={[styles.stats, { backgroundColor: colors.card }]}>
            <Pressable onPress={() => setMembersOpen(true)} style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{community.memberCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Uye</Text>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Stat value={posts.length} label="Gonderi" colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Stat value={community.postCount || posts.length} label="Paylasim" colors={colors} />
          </View>

          {isMember && (
            <View style={[styles.compose, SHADOW.card, { backgroundColor: colors.card }]}>
              <View style={[styles.composeAvatar, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="person" size={16} color={colors.primary} />
              </View>
              <TextInput
                value={postText}
                onChangeText={setPostText}
                placeholder="Toplulukta bir seyler paylas..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                multiline
              />
              <Pressable onPress={pickPostImage} style={styles.iconBtn}>
                <Ionicons name="image-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable onPress={handlePost} disabled={submitting} style={[styles.postBtn, { backgroundColor: colors.primary }]}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={16} color="#fff" />}
              </Pressable>
            </View>
          )}

          {postImageUri ? (
            <View style={styles.previewRow}>
              <Image source={{ uri: postImageUri }} style={styles.previewImg} contentFit="cover" />
              <Pressable onPress={() => setPostImageUri('')}>
                <Ionicons name="close-circle" size={22} color={colors.error} />
              </Pressable>
            </View>
          ) : null}

          <Text style={[styles.section, { color: colors.text }]}>Gonderiler</Text>
          {posts.length === 0 ? (
            <EmptyState title="Henuz gonderi yok" subtitle={isMember ? 'Ilk paylasimi sen yap' : 'Katilarak paylasimlari gor'} />
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} communityId={communityId} onPress={handlePostPress} />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={membersOpen} animationType="slide" transparent onRequestClose={() => setMembersOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Uyeler ({members.length})</Text>
              <Pressable onPress={() => setMembersOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView>
              {members.map((m) => (
                <View key={m.id} style={[styles.memberRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{m.id.slice(0, 8)}...</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{m.role || 'member'}</Text>
                  </View>
                  {isAdmin && m.id !== user?.uid ? (
                    <View style={styles.adminActions}>
                      <Pressable onPress={() => handleSetModerator(m.id)} style={[styles.adminBtn, { backgroundColor: colors.primaryLight }]}>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Mod</Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemoveMember(m.id)} style={[styles.adminBtn, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={{ color: colors.error, fontSize: 11, fontWeight: '700' }}>Cikar</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ value, label, colors }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cover: { height: 160, width: '100%' },
  back: { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 18, height: 36, left: SPACING.md, position: 'absolute', top: 44, width: 36, alignItems: 'center', justifyContent: 'center' },
  headerBody: { marginTop: -28, paddingHorizontal: SPACING.md },
  iconBox: { alignItems: 'center', borderRadius: RADIUS.lg, borderWidth: 4, height: 64, justifyContent: 'center', width: 64 },
  iconImage: { overflow: 'hidden' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
  tagChip: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '600' },
  rulesBox: { borderRadius: RADIUS.lg, borderWidth: 1, marginTop: SPACING.md, padding: SPACING.md },
  rulesTitle: { fontSize: 14, fontWeight: '800', marginBottom: SPACING.xs },
  ruleItem: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', marginTop: SPACING.sm },
  name: { fontSize: 22, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  joinBtn: { borderRadius: RADIUS.full, paddingHorizontal: 20, paddingVertical: 9 },
  desc: { fontSize: 14, lineHeight: 20, marginTop: SPACING.md },
  stats: { borderRadius: RADIUS.lg, flexDirection: 'row', marginTop: SPACING.md, paddingVertical: SPACING.md },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  divider: { width: 1 },
  compose: { alignItems: 'flex-end', borderRadius: RADIUS.lg, flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, padding: SPACING.sm },
  composeAvatar: { alignItems: 'center', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  input: { flex: 1, fontSize: 15, maxHeight: 80, paddingVertical: 6 },
  iconBtn: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  postBtn: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  previewRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  previewImg: { borderRadius: RADIUS.sm, height: 64, width: 64 },
  section: { fontSize: 18, fontWeight: '800', marginBottom: SPACING.sm, marginTop: SPACING.lg },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', padding: SPACING.md },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  memberRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', paddingVertical: SPACING.sm },
  adminActions: { flexDirection: 'row', gap: 6 },
  adminBtn: { borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 6 },
});
