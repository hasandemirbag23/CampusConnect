import { useState } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UploadProgress from '../../components/UploadProgress';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { EVENT_CATEGORIES, RADIUS, SPACING } from '../../constants';
import { Timestamp, createEvent, updateEventCover } from '../../services/eventService';
import { uploadEventCover } from '../../services/storageService';
import { trackEvent } from '../../services/analyticsService';
import { showAlert } from '../../utils';

const STEPS = ['Etkinlik Detaylari', 'Tarih & Konum', 'Kapak Gorseli'];
const STEP_WIDTH = Dimensions.get('window').width;
const CATEGORY_ICONS = {
  Konser: 'musical-notes',
  Seminer: 'school',
  Spor: 'basketball',
  Sosyal: 'people',
  Akademik: 'book',
};

export default function CreateEventScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EVENT_CATEGORIES[0]);
  const [capacity, setCapacity] = useState(25);
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [startDate, setStartDate] = useState(new Date(Date.now() + 86400000));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 90000000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [coverUri, setCoverUri] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const translateX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  const goToStep = (next) => {
    translateX.value = withSpring(-next * STEP_WIDTH, { damping: 20, stiffness: 200 });
    setStep(next);
  };

  const validateStep = () => {
    if (step === 0 && (!title.trim() || !description.trim())) {
      showAlert('Hata', 'Baslik ve aciklama zorunlu');
      return false;
    }
    if (step === 1) {
      if (!isOnline && !location.trim()) {
        showAlert('Hata', 'Konum zorunlu');
        return false;
      }
      if (endDate <= startDate) {
        showAlert('Hata', 'Bitis tarihi baslangictan sonra olmali');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 2) goToStep(step + 1);
    else handleSubmit();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setCoverUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!user) {
      showAlert('Hata', 'Oturum acik degil.');
      return;
    }
    try {
      setSubmitting(true);
      const eventId = await createEvent(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          capacity: Number(capacity) || 50,
          isOnline,
          location: isOnline ? 'Online' : location.trim(),
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          startDate: Timestamp.fromDate(startDate),
          endDate: Timestamp.fromDate(endDate),
          coverURL: '',
        },
        {
          uid: user.uid,
          displayName: profile?.displayName || user.displayName,
          photoURL: profile?.photoURL || user.photoURL,
        },
      );
      if (coverUri) {
        const coverURL = await uploadEventCover(eventId, coverUri, setUploadProgress);
        await updateEventCover(eventId, coverURL);
      }
      trackEvent('event_created', { event_id: eventId, category });
      showAlert('Basarili', 'Etkinlik olusturuldu!');
      navigation.goBack();
    } catch (err) {
      showAlert('Hata', err?.message || 'Etkinlik olusturulamadi');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const inputStyle = [styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={() => (step > 0 ? goToStep(step - 1) : navigation.goBack())} hitSlop={10}>
          <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>CampusConnect</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="close-circle-outline" size={24} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.stepInfo}>
        <Text style={[styles.stepBadge, { color: colors.primary }]}>ADIM {step + 1} / 3</Text>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 24, marginTop: 4 }]}>{STEPS[step]}</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.primaryLight }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>

      <View style={styles.stepsContainer}>
        <Animated.View style={[styles.stepsRow, slideStyle]}>
          {/* STEP 1 */}
          <View style={[styles.step, { width: STEP_WIDTH }]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>Etkinlik Basligi *</Text>
              <TextInput placeholder="Orn: Vize Oncesi Kahve Bulusmasi" placeholderTextColor={colors.textMuted}
                style={inputStyle} value={title} onChangeText={setTitle} />

              <Text style={[styles.label, { color: colors.text }]}>Kategori Secin</Text>
              <View style={styles.grid}>
                {EVENT_CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <Pressable key={cat} onPress={() => setCategory(cat)}
                      style={[styles.gridItem, { backgroundColor: colors.primaryLight, borderColor: active ? colors.primary : 'transparent' }]}>
                      <Ionicons name={CATEGORY_ICONS[cat]} size={24} color={colors.primary} />
                      <Text style={[styles.gridLabel, { color: colors.text }]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Etkinlik Aciklamasi</Text>
              <TextInput multiline numberOfLines={4} placeholder="Katilimcilara etkinligin hakkinda bilgi ver..."
                placeholderTextColor={colors.textMuted} style={[inputStyle, styles.textArea]} value={description} onChangeText={setDescription} />

              <View style={styles.capacityHeader}>
                <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Katilimci Kapasitesi</Text>
                <Text style={[styles.capacityValue, { color: colors.primary }]}>{capacity}</Text>
              </View>
              <View style={styles.capacityRow}>
                <Pressable onPress={() => setCapacity((c) => Math.max(5, c - 5))} style={[styles.capBtn, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </Pressable>
                <View style={[styles.capTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.capFill, { backgroundColor: colors.primary, width: `${(capacity / 200) * 100}%` }]} />
                </View>
                <Pressable onPress={() => setCapacity((c) => Math.min(200, c + 5))} style={[styles.capBtn, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </ScrollView>
          </View>

          {/* STEP 2 */}
          <View style={[styles.step, { width: STEP_WIDTH }]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>Baslangic Tarihi</Text>
              <Pressable onPress={() => setShowStartPicker(true)} style={inputStyle}>
                <Text style={{ color: colors.text }}>{startDate.toLocaleString('tr-TR')}</Text>
              </Pressable>
              {showStartPicker && (
                <DateTimePicker value={startDate} mode="datetime" onChange={(_, date) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (date) setStartDate(date);
                }} />
              )}
              <Text style={[styles.label, { color: colors.text }]}>Bitis Tarihi</Text>
              <Pressable onPress={() => setShowEndPicker(true)} style={inputStyle}>
                <Text style={{ color: colors.text }}>{endDate.toLocaleString('tr-TR')}</Text>
              </Pressable>
              {showEndPicker && (
                <DateTimePicker value={endDate} mode="datetime" onChange={(_, date) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (date) setEndDate(date);
                }} />
              )}

              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Online Etkinlik</Text>
                <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ true: colors.primary }} thumbColor="#fff" />
              </View>
              {!isOnline && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Konum</Text>
                  <TextInput placeholder="Orn: Merkez Kampus, A Blok" placeholderTextColor={colors.textMuted}
                    style={inputStyle} value={location} onChangeText={setLocation} />
                </>
              )}
              <Text style={[styles.label, { color: colors.text }]}>Etiketler</Text>
              <TextInput placeholder="virgul ile ayir: kahve, sohbet" placeholderTextColor={colors.textMuted}
                style={inputStyle} value={tags} onChangeText={setTags} />
            </ScrollView>
          </View>

          {/* STEP 3 */}
          <View style={[styles.step, { width: STEP_WIDTH }]}>
            <Text style={[styles.label, { color: colors.text }]}>Kapak Gorseli</Text>
            <Pressable onPress={pickImage} style={[styles.uploadBox, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.preview} contentFit="cover" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={40} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '600', marginTop: 8 }}>Gorsel sec</Text>
                </>
              )}
            </Pressable>
            {uploadProgress > 0 && uploadProgress < 1 && <UploadProgress progress={uploadProgress} label="Gorsel yukleniyor" />}
          </View>
        </Animated.View>
      </View>

      <Pressable disabled={submitting} onPress={handleNext} style={[styles.nextBtn, { backgroundColor: colors.primary, marginBottom: insets.bottom + SPACING.sm }]}>
        {submitting ? <ActivityIndicator color="#fff" /> : (
          <>
            <Text style={styles.nextText}>{step === 2 ? 'Olustur' : 'Devam Et'}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.md },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  stepInfo: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  stepBadge: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  progressTrack: { borderRadius: 3, height: 6, marginHorizontal: SPACING.md, marginTop: SPACING.md, overflow: 'hidden' },
  progressBar: { borderRadius: 3, height: '100%' },
  stepsContainer: { flex: 1, marginTop: SPACING.lg, overflow: 'hidden' },
  stepsRow: { flexDirection: 'row', flex: 1 },
  step: { paddingHorizontal: SPACING.md },
  label: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: { borderRadius: RADIUS.md, borderWidth: 1, fontSize: 16, paddingHorizontal: SPACING.md, paddingVertical: 14 },
  textArea: { height: 110, textAlignVertical: 'top' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  gridItem: { alignItems: 'center', borderRadius: RADIUS.lg, borderWidth: 2, gap: 8, paddingVertical: SPACING.md, width: '48%' },
  gridLabel: { fontSize: 14, fontWeight: '700' },
  capacityHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  capacityValue: { fontSize: 22, fontWeight: '800' },
  capacityRow: { alignItems: 'center', flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  capBtn: { alignItems: 'center', borderRadius: RADIUS.full, height: 40, justifyContent: 'center', width: 40 },
  capTrack: { borderRadius: 4, flex: 1, height: 8, overflow: 'hidden' },
  capFill: { borderRadius: 4, height: '100%' },
  switchRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  uploadBox: { alignItems: 'center', borderRadius: RADIUS.lg, borderStyle: 'dashed', borderWidth: 2, height: 220, justifyContent: 'center', overflow: 'hidden' },
  preview: { height: '100%', width: '100%' },
  nextBtn: { alignItems: 'center', borderRadius: RADIUS.md, flexDirection: 'row', gap: 8, justifyContent: 'center', margin: SPACING.md, paddingVertical: 16 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
