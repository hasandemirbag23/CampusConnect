import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { useCommunity } from '../../context/CommunityContext';
import { useTheme } from '../../context/ThemeContext';
import { COMMUNITY_CATEGORIES, RADIUS, SPACING } from '../../constants';
import { showAlert } from '../../utils';

export default function CreateCommunityScreen({ navigation }) {
  const { colors } = useTheme();
  const { createCommunity } = useCommunity();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconURL, setIconURL] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [category, setCategory] = useState(COMMUNITY_CATEGORIES[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      showAlert('Hata', 'Ad ve aciklama zorunlu');
      return;
    }
    try {
      setSubmitting(true);
      const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
      const rules = rulesText.split('\n').map((r) => r.trim()).filter(Boolean);
      const id = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        category,
        isPrivate,
        iconURL: iconURL.trim(),
        tags,
        rules,
      });
      showAlert('Basarili', 'Topluluk olusturuldu');
      navigation.replace('CommunityDetail', { communityId: id });
    } catch (e) {
      showAlert('Hata', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: SPACING.md }}>
      <Text style={[styles.title, { color: colors.text }]}>Topluluk Olustur</Text>
      <TextInput placeholder="Topluluk adi" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
      <TextInput placeholder="Aciklama" placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription}
        multiline style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
      <TextInput placeholder="Icon URL (opsiyonel)" placeholderTextColor={colors.textMuted} value={iconURL} onChangeText={setIconURL}
        autoCapitalize="none" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
      <TextInput placeholder="Etiketler (virgulle ayir)" placeholderTextColor={colors.textMuted} value={tagsText} onChangeText={setTagsText}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
      <TextInput placeholder="Kurallar (her satir bir kural)" placeholderTextColor={colors.textMuted} value={rulesText} onChangeText={setRulesText}
        multiline style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori</Text>
      <View style={styles.chips}>
        {COMMUNITY_CATEGORIES.map((cat) => (
          <Pressable key={cat} onPress={() => setCategory(cat)}
            style={[styles.chip, { backgroundColor: category === cat ? colors.primary : colors.card, borderColor: colors.border }]}>
            <Text style={{ color: category === cat ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>{cat}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.text }]}>Ozel topluluk</Text>
        <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: colors.primary }} />
      </View>
      <Pressable onPress={handleSubmit} disabled={submitting} style={[styles.btn, { backgroundColor: colors.primary }]}>
        <Text style={styles.btnText}>{submitting ? 'Olusturuluyor...' : 'Olustur'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: SPACING.lg },
  input: { borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: 14 },
  textarea: { height: 100, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: SPACING.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  chip: { borderRadius: RADIUS.full, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  btn: { alignItems: 'center', borderRadius: RADIUS.md, paddingVertical: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
