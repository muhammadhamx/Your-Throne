import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS, SPACING, SHADOWS } from '@/utils/constants';

type FeedbackType = 'bug' | 'suggestion' | 'love' | 'other';

const FEEDBACK_TYPES: { key: FeedbackType; emoji: string; label: string }[] = [
  { key: 'bug', emoji: '🐛', label: 'Bug Report' },
  { key: 'suggestion', emoji: '💡', label: 'Suggestion' },
  { key: 'love', emoji: '❤️', label: 'Just Love' },
  { key: 'other', emoji: '💬', label: 'Other' },
];

const SUBJECT_MAP: Record<FeedbackType, string> = {
  bug: 'Bug Report — Royal Throne App',
  suggestion: 'Feature Suggestion — Royal Throne App',
  love: 'Some Love for Royal Throne ❤️',
  other: 'Feedback — Royal Throne App',
};

export default function ContactScreen() {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!selectedType) {
      Alert.alert('Hold up!', 'Pick a feedback type first.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Empty message', 'Write something — even "hi" counts.');
      return;
    }

    Keyboard.dismiss();
    const subject = encodeURIComponent(SUBJECT_MAP[selectedType]);
    const body = encodeURIComponent(
      `Type: ${selectedType}\n\n${message.trim()}\n\n---\nSent from Royal Throne App`
    );
    const mailto = `mailto:royalthroneapp@gmail.com?subject=${subject}&body=${body}`;

    Linking.openURL(mailto).catch(() => {
      Alert.alert(
        'No email app?',
        'Send your feedback directly to royalthroneapp@gmail.com — we read everything!',
      );
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📮</Text>
        <Text style={styles.headerTitle}>Talk to Us</Text>
        <Text style={styles.headerSub}>
          Found a bug? Got an idea? Just want to say hi?{'\n'}We read every single message. For real.
        </Text>
      </View>

      {/* Feedback type selector */}
      <Text style={styles.label}>What's this about?</Text>
      <View style={styles.typeGrid}>
        {FEEDBACK_TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.typeCard,
              selectedType === t.key && styles.typeCardSelected,
            ]}
            onPress={() => setSelectedType(t.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.typeEmoji}>{t.emoji}</Text>
            <Text
              style={[
                styles.typeLabel,
                selectedType === t.key && styles.typeLabelSelected,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Message input */}
      <Text style={styles.label}>Your message</Text>
      <View style={styles.inputCard}>
        <TextInput
          style={styles.textArea}
          value={message}
          onChangeText={setMessage}
          placeholder={
            selectedType === 'bug'
              ? 'Describe the bug... what happened, what you expected, steps to reproduce...'
              : selectedType === 'suggestion'
              ? 'What feature would make Throne even better?'
              : selectedType === 'love'
              ? 'We love you too! Tell us what you enjoy most...'
              : 'Whatever is on your mind...'
          }
          placeholderTextColor={COLORS.textTertiary}
          multiline
          maxLength={2000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{message.length}/2000</Text>
      </View>

      {/* Send button */}
      <TouchableOpacity
        style={styles.sendBtn}
        onPress={handleSend}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={GRADIENTS.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sendBtnGradient}
        >
          <Ionicons name="send" size={18} color={COLORS.primaryDark} />
          <Text style={styles.sendBtnText}>Send Feedback</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Direct email fallback */}
      <View style={styles.directCard}>
        <Text style={styles.directLabel}>Or email us directly at</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL('mailto:royalthroneapp@gmail.com')}
        >
          <Text style={styles.directEmail}>royalthroneapp@gmail.com</Text>
        </TouchableOpacity>
      </View>

      {/* Fun note */}
      <View style={styles.funCard}>
        <Text style={styles.funEmoji}>🧻</Text>
        <Text style={styles.funText}>
          Every bug you report makes a throne somewhere more comfortable. Every suggestion could become a feature. You're literally shaping the future of pooping.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING['3xl'],
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
    paddingHorizontal: 2,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.subtle,
  },
  typeCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '12',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeLabelSelected: {
    color: COLORS.accent,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    ...SHADOWS.subtle,
  },
  textArea: {
    fontSize: 15,
    color: COLORS.text,
    minHeight: 140,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  sendBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.md,
    ...SHADOWS.glow,
  },
  sendBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: SPACING.xs,
  },
  sendBtnText: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: '800',
  },
  directCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  directLabel: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  directEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
  },
  funCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  funEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  funText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
