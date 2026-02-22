import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MAX_MESSAGE_LENGTH, MESSAGE_RATE_LIMIT_MS } from '@/utils/constants';

interface Props {
  onSend: (message: string) => void;
  placeholder?: string;
}

export function ChatInput({ onSend, placeholder = 'Type a message...' }: Props) {
  const [text, setText] = useState('');
  const lastSentRef = useRef(0);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (now - lastSentRef.current < MESSAGE_RATE_LIMIT_MS) return;

    lastSentRef.current = now;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        maxLength={MAX_MESSAGE_LENGTH}
        multiline
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[styles.sendButton, !text.trim() && styles.sendDisabled]}
        onPress={handleSend}
        disabled={!text.trim()}
        activeOpacity={0.7}
      >
        <Ionicons
          name="send"
          size={20}
          color={text.trim() ? '#FFFFFF' : COLORS.textLight}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: {
    backgroundColor: COLORS.border,
  },
});
