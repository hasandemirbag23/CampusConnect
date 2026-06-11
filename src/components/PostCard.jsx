import { memo, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import LikeButton from './LikeButton';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOW, SPACING } from '../constants';
import { subscribeToPostLike } from '../services/communityService';
import { formatDate, getPostContent, getPostImages } from '../utils';

function PostCard({ post, communityId, onPress }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { likePost } = useCommunity();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!user || !communityId) return undefined;
    return subscribeToPostLike(communityId, post.id, user.uid, setLiked);
  }, [communityId, post.id, user]);

  const handleLike = async () => {
    if (!user || !communityId) return;
    await likePost(communityId, post.id, !liked);
  };

  return (
    <Pressable
      onPress={() => onPress?.(post)}
      style={({ pressed }) => [styles.card, SHADOW.card, { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1 }]}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{post.displayName?.[0] || '?'}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]}>{post.displayName}</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(post.createdAt)}</Text>
        </View>
      </View>
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={4}>{getPostContent(post)}</Text>
      {getPostImages(post).map((uri) => (
        <Image key={uri} source={{ uri }} style={styles.image} contentFit="cover" />
      ))}
      <View style={styles.footer}>
        <LikeButton liked={liked} count={post.likeCount || 0} onToggle={handleLike} color={colors.error} size={16} />
        <View style={styles.stat}>
          <Text style={[styles.statText, { color: colors.textMuted }]}>{post.commentCount || 0} yorum</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(PostCard);

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, marginBottom: SPACING.md, padding: SPACING.md },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: SPACING.sm },
  avatar: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  headerText: { flex: 1, marginLeft: SPACING.sm },
  name: { fontSize: 14, fontWeight: '700' },
  date: { fontSize: 12, marginTop: 2 },
  text: { fontSize: 15, lineHeight: 22 },
  image: { borderRadius: RADIUS.md, height: 160, marginTop: SPACING.sm, width: '100%' },
  footer: { alignItems: 'center', flexDirection: 'row', gap: 16, marginTop: SPACING.sm },
  stat: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  statText: { fontSize: 13 },
});
