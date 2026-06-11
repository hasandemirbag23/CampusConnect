import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import UploadProgress from '../../components/UploadProgress';
import { useMarket } from '../../context/MarketContext';
import { useTheme } from '../../context/ThemeContext';
import { LISTING_CATEGORIES, LISTING_CONDITIONS, RADIUS, SPACING } from '../../constants';
import { getListing } from '../../services/marketService';
import { uploadListingImages } from '../../services/storageService';
import { showAlert } from '../../utils';

const STEP_WIDTH = Dimensions.get('window').width - SPACING.md * 2;
const CONDITION_LABELS = { new: 'Sifir', 'like-new': 'Az Kullanilmis', good: 'Iyi', fair: 'Orta' };

export default function CreateListingScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { createListing, updateListing } = useMarket();
  const listingId = route.params?.listingId;
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(LISTING_CATEGORIES[0]);
  const [condition, setCondition] = useState(LISTING_CONDITIONS[1]);
  const [tagsText, setTagsText] = useState('');
  const [images, setImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(Boolean(listingId));

  const translateX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  useEffect(() => {
    if (!listingId) return;
    getListing(listingId).then((listing) => {
      if (listing) {
        setTitle(listing.title || '');
        setDescription(listing.description || '');
        setPrice(String(listing.price || ''));
        setCategory(listing.category || LISTING_CATEGORIES[0]);
        setCondition(listing.condition || LISTING_CONDITIONS[1]);
        setTagsText((listing.tags || []).join(', '));
        const urls = listing.imageURLs?.length ? listing.imageURLs : listing.imageURL ? [listing.imageURL] : [];
        setImages(urls);
      }
      setLoading(false);
    });
  }, [listingId]);

  const goToStep = (next) => {
    translateX.value = withSpring(-next * STEP_WIDTH, { damping: 20, stiffness: 200 });
    setStep(next);
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.slice(0, 5 - prev.length).map((a) => a.uri)].slice(0, 5));
    }
  };

  const moveImage = (index, dir) => {
    const next = index + dir;
    if (next < 0 || next >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price) {
      showAlert('Hata', 'Tum alanlar zorunlu');
      return;
    }
    try {
      setSubmitting(true);
      const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
      const basePayload = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        condition,
        tags,
        imageURLs: [],
        imageURL: '',
      };

      let id = listingId;
      if (listingId) await updateListing(listingId, basePayload);
      else id = await createListing(basePayload);

      const localImages = images.filter((uri) => !uri.startsWith('http'));
      const remoteImages = images.filter((uri) => uri.startsWith('http'));

      if (localImages.length && id) {
        const uploaded = await uploadListingImages(id, localImages, setUploadProgress);
        const imageURLs = [...remoteImages, ...uploaded];
        await updateListing(id, { imageURLs, imageURL: imageURLs[0] || '' });
      } else if (id && images.length) {
        await updateListing(id, { imageURLs: images, imageURL: images[0] || '' });
      }

      showAlert('Basarili', 'Ilan kaydedildi');
      navigation.goBack();
    } catch (e) {
      showAlert('Hata', e.message);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleNext = () => {
    if (step === 0) {
      if (!title.trim() || !description.trim() || !price) {
        showAlert('Hata', 'Baslik, aciklama ve fiyat zorunlu');
        return;
      }
      goToStep(1);
    } else {
      handleSubmit();
    }
  };

  if (loading) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>
        {listingId ? 'Ilan Duzenle' : step === 0 ? 'Ilan Detaylari' : 'Fotograf & Yayinla'}
      </Text>
      <View style={styles.steps}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.stepDot, { backgroundColor: step >= i ? colors.primary : colors.border }]} />
        ))}
      </View>

      <View style={styles.sliderWrap}>
        <Animated.View style={[styles.slider, slideStyle]}>
          <ScrollView style={{ width: STEP_WIDTH }} keyboardShouldPersistTaps="handled">
            <TextInput placeholder="Baslik" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
            <TextInput placeholder="Aciklama" placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription}
              multiline style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
            <TextInput placeholder="Fiyat (TL)" placeholderTextColor={colors.textMuted} value={price} onChangeText={setPrice}
              keyboardType="numeric" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
            <TextInput placeholder="Etiketler (virgulle ayir)" placeholderTextColor={colors.textMuted} value={tagsText} onChangeText={setTagsText}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori</Text>
            <View style={styles.chips}>
              {LISTING_CATEGORIES.map((cat) => (
                <Pressable key={cat} onPress={() => setCategory(cat)}
                  style={[styles.chip, { backgroundColor: category === cat ? colors.primary : colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: category === cat ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>{cat}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Durum</Text>
            <View style={styles.chips}>
              {LISTING_CONDITIONS.map((c) => (
                <Pressable key={c} onPress={() => setCondition(c)}
                  style={[styles.chip, { backgroundColor: condition === c ? colors.primary : colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: condition === c ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>{CONDITION_LABELS[c]}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <ScrollView style={{ width: STEP_WIDTH }}>
            <Pressable onPress={pickImages} style={[styles.photoBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Fotograf Sec (max 5)</Text>
            </Pressable>
            {images.length > 0 && (
              <View style={styles.thumbGrid}>
                {images.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.thumbWrap}>
                    <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                    <View style={styles.thumbActions}>
                      <Pressable onPress={() => moveImage(index, -1)} disabled={index === 0}>
                        <Ionicons name="chevron-back" size={16} color={index === 0 ? colors.border : colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => removeImage(index)}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </Pressable>
                      <Pressable onPress={() => moveImage(index, 1)} disabled={index === images.length - 1}>
                        <Ionicons name="chevron-forward" size={16} color={index === images.length - 1 ? colors.border : colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
            {uploadProgress > 0 && uploadProgress < 1 ? <UploadProgress progress={uploadProgress} /> : null}
          </ScrollView>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        {step > 0 ? (
          <Pressable onPress={() => goToStep(0)} style={[styles.btnSecondary, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Geri</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={handleNext} disabled={submitting} style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}>
          <Text style={styles.btnText}>{submitting ? 'Kaydediliyor...' : step === 0 ? 'Devam' : 'Yayinla'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md },
  pageTitle: { fontSize: 22, fontWeight: '800', marginBottom: SPACING.sm },
  steps: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  stepDot: { borderRadius: 4, flex: 1, height: 4 },
  sliderWrap: { flex: 1, overflow: 'hidden' },
  slider: { flexDirection: 'row', width: STEP_WIDTH * 2 },
  input: { borderRadius: RADIUS.md, borderWidth: 1, fontSize: 16, marginBottom: SPACING.sm, padding: SPACING.md },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: SPACING.xs, marginTop: SPACING.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.sm },
  chip: { borderRadius: RADIUS.full, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  photoBtn: { alignItems: 'center', borderRadius: RADIUS.md, borderStyle: 'dashed', borderWidth: 1, marginBottom: SPACING.sm, padding: SPACING.md },
  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  thumbWrap: { alignItems: 'center' },
  thumb: { borderRadius: RADIUS.sm, height: 72, width: 72 },
  thumbActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  footer: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  btn: { alignItems: 'center', borderRadius: RADIUS.md, paddingVertical: 16 },
  btnSecondary: { alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
