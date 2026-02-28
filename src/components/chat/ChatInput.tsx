import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, ANIMATION } from '@/utils/constants';
import { MAX_MESSAGE_LENGTH, MESSAGE_RATE_LIMIT_MS } from '@/utils/constants';

interface Props {
  onSend: (message: string) => void;
  placeholder?: string;
}

export function ChatInput({ onSend, placeholder = 'Type a message...' }: Props) {
  const [text, setText] = useState('');
  const lastSentRef = useRef(0);
  const sendScale = useSharedValue(1);
  const hasText = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (now - lastSentRef.current < MESSAGE_RATE_LIMIT_MS) return;

    lastSentRef.current = now;
    onSend(trimmed);
    setText('');
  };

  const handlePressIn = () => {
    if (!hasText) return;
    sendScale.value = withSpring(0.88, ANIMATION.springSnappy);
  };

  const handlePressOut = () => {
    sendScale.value = withSpring(1, ANIMATION.spring);
  };

  const sendBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
    opacity: interpolate(sendScale.value, [0.88, 1], [0.7, 1]),
  }));

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        maxLength={MAX_MESSAGE_LENGTH}
        multiline
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <Pressable
        onPress={handleSend}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!hasText}
      >
        <Animated.View style={[styles.sendBtn, !hasText && styles.sendBtnDisabled, sendBtnStyle]}>
          <Ionicons
            name="send"
            size={17}
            color={hasText ? '#fff' : COLORS.textTertiary}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
});
