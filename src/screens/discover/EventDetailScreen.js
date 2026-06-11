import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import CapacityBar from '../../components/CapacityBar';
import LikeButton from '../../components/LikeButton';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SHADOW, SPACING } from '../../constants';
import {
  addEventComment,
  subscribeToAttendees,
  subscribeToComments,
  subscribeToEvent,
  subscribeToEventLike,
} from '../../services/eventService';
import { trackEvent } from '../../services/analyticsService';
import { formatDate, showAlert } from '../../utils';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const { joinEvent, leaveEvent, likeEvent, saveEvent } = useEvents();
  const [liked, setLiked] = useState(false);
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const heroOpacity = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 400 });
  }, [heroOpacity]);

  const heroStyle = useAnimatedStyle(() => ({ opacity: heroOpacity.value }));

  useEffect(() => {
    const unsubEvent = subscribeToEvent(eventId, (data) => {
      setEvent(data);
      setLoading(false);
      if (data) trackEvent('event_viewed', { event_id: eventId });
    });
    const unsubAttendees = subscribeToAttendees(eventId, setAttendees);
    const unsubComments = subscribeToComments(eventId, setComments);
    return () => {
      unsubEvent();
      unsubAttendees();
      unsubComments();
    };
  }, [eventId]);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeToEventLike(eventId, user.uid, setLiked);
  }, [eventId, user]);

  useEffect(() => {
    if (user) setIsJoined(attendees.some((a) => a.id === user.uid));
  }, [attendees, user]);

  const handleJoinLeave = async () => {
    if (!user) return;
    try {
      setActionLoading(true);
      if (isJoined) await leaveEvent(eventId);
      else {
        const isFull = event?.capacity && (event.attendeeCount || 0) >= event.capacity;
        await joinEvent(eventId, isFull ? 'waitlist' : 'confirmed');
        trackEvent('event_joined', { event_id: eventId });
      }
    } catch (err) {
      showAlert('Hata', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !user) return;
    try {
      await addEventComment(eventId, user, commentText.trim());
      setCommentText('');
    } catch (err) {
      showAlert('Hata', err.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Etkinlik bulunamadi</Text>
      </View>
    );
  }

  const isFull = event.capacity && (event.attendeeCount || 0) >= event.capacity;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Animated.View style={heroStyle}>
          {event.coverURL ? (
            <Image source={{ uri: event.coverURL }} style={styles.hero} contentFit="cover" />
          ) : (
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.hero}>
              <Ionicons name="calendar" size={48} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
          )}
        </Animated.View>

        <View style={[styles.content, SHADOW.card, { backgroundColor: colors.card }]}>
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{event.category}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatDate(event.startDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {event.isOnline ? 'Online' : event.location}
            </Text>
          </View>

          <CapacityBar current={event.attendeeCount || 0} max={event.capacity || 0} />

          <View style={styles.actionRow}>
            <View style={[styles.likeBtn, { borderColor: colors.border }]}>
              <LikeButton
                liked={liked}
                count={event.likeCount || 0}
                onToggle={async () => {
                  try {
                    await likeEvent(eventId, !liked);
                  } catch (e) {
                    showAlert('Hata', e.message);
                  }
                }}
              />
            </View>
            <Pressable
              onPress={async () => {
                try {
                  await saveEvent(eventId, true);
                  showAlert('Basarili', 'Etkinlik kaydedildi');
                } catch (e) {
                  showAlert('Hata', e.message);
                }
              }}
              style={[styles.likeBtn, { borderColor: colors.border }]}
            >
              <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>

          <Pressable onPress={() => navigation.navigate('UserProfile', { userId: event.organizerId })}>
            <View style={[styles.organizerRow, { backgroundColor: colors.primaryLight }]}>
              <View style={[styles.organizerAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.organizerInitial}>{event.organizer?.displayName?.[0] || '?'}</Text>
              </View>
              <View>
                <Text style={[styles.organizerLabel, { color: colors.textMuted }]}>Organizator</Text>
                <Text style={[styles.organizerName, { color: colors.text }]}>
                  {event.organizer?.displayName || 'Bilinmiyor'}
                </Text>
              </View>
            </View>
          </Pressable>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aciklama</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{event.description}</Text>

          {event.tags?.length > 0 && (
            <View style={styles.tags}>
              {event.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Katilimcilar</Text>
          <View style={styles.avatarRow}>
            {attendees.slice(0, 5).map((a, i) => (
              <View key={a.id} style={[styles.miniAvatar, { backgroundColor: colors.primary, marginLeft: i ? -8 : 0 }]}>
                <Text style={styles.miniAvatarText}>{a.id[0].toUpperCase()}</Text>
              </View>
            ))}
            <Text style={[styles.meta, { color: colors.textMuted, marginLeft: 8 }]}>
              {attendees.length} kisi
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Yorumlar ({comments.length})</Text>
          {comments.map((c) => (
            <View key={c.id} style={[styles.comment, { borderColor: colors.border }]}>
              <Text style={[styles.commentAuthor, { color: colors.text }]}>{c.displayName}</Text>
              <Text style={{ color: colors.textSecondary }}>{c.text}</Text>
            </View>
          ))}

          <View style={styles.commentInput}>
            <TextInput
              placeholder="Yorum yaz..."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={commentText}
              onChangeText={setCommentText}
            />
            <Pressable onPress={handleComment} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.footerPrice, { color: colors.text }]}>Ucretsiz</Text>
          <Text style={[styles.footerMeta, { color: colors.textMuted }]}>
            {isFull ? 'Bekleme listesi' : `${(event.capacity || 0) - (event.attendeeCount || 0)} yer kaldi`}
          </Text>
        </View>
        <Pressable
          disabled={actionLoading}
          onPress={handleJoinLeave}
          style={[styles.joinBtn, { backgroundColor: isJoined ? colors.border : colors.primary }]}
        >
          {actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.joinText, { color: isJoined ? colors.text : '#fff' }]}>
              {isJoined ? 'Ayril' : isFull ? 'Bekleme Listesi' : 'Katil  →'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', height: 240, justifyContent: 'center', width: '100%' },
  content: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -20,
    padding: SPACING.lg,
  },
  badge: { alignSelf: 'flex-start', borderRadius: RADIUS.full, marginBottom: SPACING.sm, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', marginBottom: SPACING.md },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 6 },
  meta: { fontSize: 14 },
  organizerRow: { alignItems: 'center', borderRadius: RADIUS.lg, flexDirection: 'row', gap: 12, marginTop: SPACING.md, padding: SPACING.md },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  likeBtn: { alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8 },
  organizerAvatar: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  organizerInitial: { color: '#fff', fontSize: 18, fontWeight: '800' },
  organizerLabel: { fontSize: 12 },
  organizerName: { fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: SPACING.sm, marginTop: SPACING.lg },
  description: { fontSize: 15, lineHeight: 24 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  tag: { borderRadius: RADIUS.full, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
  avatarRow: { alignItems: 'center', flexDirection: 'row' },
  miniAvatar: { alignItems: 'center', borderRadius: 16, borderColor: '#fff', borderWidth: 2, height: 32, justifyContent: 'center', width: 32 },
  miniAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  comment: { borderBottomWidth: 1, paddingVertical: SPACING.sm },
  commentAuthor: { fontWeight: '700', marginBottom: 2 },
  commentInput: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  input: { borderRadius: RADIUS.full, borderWidth: 1, flex: 1, paddingHorizontal: SPACING.md, paddingVertical: 12 },
  sendBtn: { alignItems: 'center', borderRadius: RADIUS.full, height: 44, justifyContent: 'center', width: 44 },
  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    position: 'absolute',
    right: 0,
  },
  footerPrice: { fontSize: 18, fontWeight: '800' },
  footerMeta: { fontSize: 12, marginTop: 2 },
  joinBtn: { borderRadius: RADIUS.full, minWidth: 140, paddingHorizontal: 24, paddingVertical: 14 },
  joinText: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
});
