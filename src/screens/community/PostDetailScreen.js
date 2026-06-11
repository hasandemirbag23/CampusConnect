import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';

import LikeButton from '../../components/LikeButton';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants';
import {
  addPostComment,
  subscribeToPost,
  subscribeToPostComments,
  subscribeToPostLike,
} from '../../services/communityService';
import { formatDate, getPostContent, getPostImages, showAlert } from '../../utils';

export default function PostDetailScreen({ route }) {
  const { communityId, postId } = route.params;
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const { likePost } = useCommunity();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    const unsub = subscribeToPost(communityId, postId, setPost);
    return unsub;
  }, [communityId, postId]);

  useEffect(() => {
    const unsub = subscribeToPostComments(communityId, postId, setComments);
    return unsub;
  }, [communityId, postId]);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeToPostLike(communityId, postId, user.uid, setLiked);
  }, [communityId, postId, user]);

  const handleComment = async () => {
    if (!text.trim() || !user) return;
    try {
      await addPostComment(communityId, postId, {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName,
        photoURL: profile?.photoURL || user.photoURL,
      }, text.trim());
      setText('');
    } catch (e) {
      showAlert('Hata', e.message);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      await likePost(communityId, postId, !liked);
    } catch (e) {
      showAlert('Hata', e.message);
    }
  };

  if (!post) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
        <View style={[styles.post, { backgroundColor: colors.card }]}>
          <Text style={[styles.author, { color: colors.text }]}>{post.displayName}</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(post.createdAt)}</Text>
          <Text style={[styles.body, { color: colors.text }]}>{getPostContent(post)}</Text>
          {getPostImages(post).map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.image} contentFit="cover" />
          ))}
          <View style={styles.likeRow}>
            <LikeButton liked={liked} count={post.likeCount || 0} onToggle={handleLike} color={colors.error} />
            <Text style={[styles.commentCount, { color: colors.textMuted }]}>
              {post.commentCount ?? comments.length} yorum
            </Text>
          </View>
        </View>
        <Text style={[styles.section, { color: colors.text }]}>Yorumlar ({comments.length})</Text>
        {comments.map((c) => (
          <View key={c.id} style={[styles.comment, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.author, { color: colors.text }]}>{c.displayName}</Text>
            <Text style={[styles.body, { color: colors.text }]}>{c.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Yorum yaz..."
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable onPress={handleComment} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Text style={styles.btnText}>Gonder</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  post: { borderRadius: RADIUS.lg, marginBottom: SPACING.md, padding: SPACING.md },
  author: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 12, marginTop: 4 },
  body: { fontSize: 15, lineHeight: 22, marginTop: SPACING.sm },
  image: { borderRadius: RADIUS.md, height: 200, marginTop: SPACING.sm, width: '100%' },
  likeRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  commentCount: { fontSize: 13 },
  section: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
  comment: { borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm, padding: SPACING.sm },
  inputRow: { borderTopWidth: 1, flexDirection: 'row', gap: 8, padding: SPACING.sm },
  input: { flex: 1, fontSize: 15, paddingHorizontal: SPACING.sm },
  btn: { borderRadius: RADIUS.md, justifyContent: 'center', paddingHorizontal: SPACING.md },
  btnText: { color: '#fff', fontWeight: '700' },
});
