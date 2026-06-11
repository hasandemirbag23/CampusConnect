import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import UploadProgress from '../../components/UploadProgress';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants';
import { uploadProfilePhoto } from '../../services/storageService';
import { showAlert } from '../../utils';

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [year, setYear] = useState(String(profile?.year || ''));
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState((profile?.interests || []).join(', '));
  const [photoUri, setPhotoUri] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const previewUri = photoUri || profile?.photoURL;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      let photoURL = profile?.photoURL || '';

      if (photoUri) {
        photoURL = await uploadProfilePhoto(user.uid, photoUri, setUploadProgress);
      }

      await updateProfile({
        displayName: displayName.trim(),
        department: department.trim(),
        year: Number(year) || null,
        bio: bio.trim(),
        interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
        ...(photoURL ? { photoURL } : {}),
      });
      showAlert('Basarili', 'Profil guncellendi');
      navigation.goBack();
    } catch (e) {
      showAlert('Hata', e.message);
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: SPACING.md }}>
      <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.avatar}>
            <Text style={styles.avatarLetter}>{displayName[0]?.toUpperCase() || '?'}</Text>
          </LinearGradient>
        )}
        <View style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="camera" size={16} color="#fff" />
        </View>
      </Pressable>
      <Text style={[styles.avatarHint, { color: colors.textMuted }]}>Fotograf degistirmek icin dokun</Text>

      {uploadProgress > 0 && uploadProgress < 1 ? <UploadProgress progress={uploadProgress} /> : null}

      <TextInput placeholder="Ad Soyad" placeholderTextColor={colors.textMuted} value={displayName} onChangeText={setDisplayName} style={inputStyle} />
      <TextInput placeholder="Bolum" placeholderTextColor={colors.textMuted} value={department} onChangeText={setDepartment} style={inputStyle} />
      <TextInput placeholder="Sinif" placeholderTextColor={colors.textMuted} value={year} onChangeText={setYear} keyboardType="number-pad" style={inputStyle} />
      <TextInput placeholder="Bio" placeholderTextColor={colors.textMuted} value={bio} onChangeText={setBio} multiline style={[inputStyle, styles.textarea]} />
      <TextInput placeholder="Ilgi alanlari (virgul ile)" placeholderTextColor={colors.textMuted} value={interests} onChangeText={setInterests} style={inputStyle} />
      <Pressable onPress={handleSave} disabled={saving} style={[styles.btn, { backgroundColor: colors.primary }]}>
        <Text style={styles.btnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatarWrap: { alignSelf: 'center', marginBottom: SPACING.xs, position: 'relative' },
  avatar: { alignItems: 'center', borderRadius: 48, height: 96, justifyContent: 'center', width: 96 },
  avatarLetter: { color: '#fff', fontSize: 36, fontWeight: '800' },
  cameraBtn: { alignItems: 'center', borderRadius: 14, bottom: 0, height: 28, justifyContent: 'center', position: 'absolute', right: 0, width: 28 },
  avatarHint: { fontSize: 12, marginBottom: SPACING.lg, textAlign: 'center' },
  input: { borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: 14 },
  textarea: { height: 80, textAlignVertical: 'top' },
  btn: { alignItems: 'center', borderRadius: RADIUS.md, paddingVertical: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
