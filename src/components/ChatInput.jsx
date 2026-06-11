import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants';

export default function ChatInput({ onSend, onSendImage, disabled }) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const pickImage = async () => {
    if (!onSendImage || uploading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    try {
      setUploading(true);
      await onSendImage(result.assets[0].uri);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {onSendImage ? (
        <Pressable onPress={pickImage} disabled={disabled || uploading} style={styles.attachBtn}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="image-outline" size={22} color={colors.primary} />
          )}
        </Pressable>
      ) : null}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Mesaj yaz..."
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
        multiline
        editable={!disabled && !uploading}
      />
      <Pressable onPress={handleSend} disabled={disabled || uploading || !text.trim()} style={[styles.btn, { backgroundColor: colors.primary }]}>
        <Ionicons name="send" size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: SPACING.sm,
  },
  attachBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 36,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  btn: {
    alignItems: 'center',
    borderRadius: RADIUS.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
