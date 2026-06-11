import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants';
import { authInputStyle } from './authInputStyles';
import { showAlert } from '../../utils';

export default function CompleteProfileScreen() {
  const { colors } = useTheme();
  const { updateProfile } = useAuth();
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState('');

  const handleSave = async () => {
    if (!department || !year) {
      showAlert('Hata', 'Bolum ve sinif zorunlu');
      return;
    }

    try {
      await updateProfile({
        department: department.trim(),
        year: Number(year),
        interests: interests.split(',').map((item) => item.trim()).filter(Boolean),
      });
    } catch (error) {
      showAlert('Hata', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Profilini Tamamla</Text>
      <TextInput
        placeholder="Bolum"
        placeholderTextColor={colors.textMuted}
        style={[authInputStyle.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
        value={department}
        onChangeText={setDepartment}
      />
      <TextInput
        keyboardType="number-pad"
        placeholder="Sinif (ornek: 2)"
        placeholderTextColor={colors.textMuted}
        style={[authInputStyle.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
        value={year}
        onChangeText={setYear}
      />
      <TextInput
        placeholder="Ilgi alanlari (virgul ile)"
        placeholderTextColor={colors.textMuted}
        style={[authInputStyle.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
        value={interests}
        onChangeText={setInterests}
      />
      <Pressable onPress={handleSave} style={[authInputStyle.button, { backgroundColor: colors.primary }]}>
        <Text style={authInputStyle.buttonText}>Kaydet</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: SPACING.lg },
});
