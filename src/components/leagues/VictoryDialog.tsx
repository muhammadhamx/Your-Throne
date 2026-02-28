import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useWeeklyResultStore } from '@/stores/weeklyResultStore';
import { MAX_CHAMPION_NOTE_LENGTH } from '@/utils/constants';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

interface VictoryDialogProps {
  visible: boolean;
  userId: string;
  leagueEmoji: string;
  onDismiss: () => void;
}

export function VictoryDialog({ visible, userId, leagueEmoji, onDismiss }: VictoryDialogProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const postNote = useWeeklyResultStore((s) => s.postNote);

  const handleSubmit = async () => {
    if (!note.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await postNote(userId, note.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDismiss();
    } catch {
      // Silent fail
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Animated.View entering={FadeIn.duration(300)} style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onDismiss} activeOpacity={1} />
        </Animated.View>

        <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
          {/* Gold accent */}
          <LinearGradient
            colors={GRADIENTS.gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentBar}
          />

          {/* Handle */}
          <View style={styles.handle} />

          {/* Trophy */}
          <Text style={styles.trophyEmoji}>🏆</Text>

          {/* Title */}
          <Text style={styles.title}>YOUR LEAGUE CONQUERED THIS WEEK!</Text>
          <Text style={styles.leagueEmoji}>{leagueEmoji}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Leave your mark on the Champion's Wall for the whole kingdom to see
          </Text>

          {/* Text input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={(text) => setNote(text.slice(0, MAX_CHAMPION_NOTE_LENGTH))}
              placeholder="Drop your royal wisdom here..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              maxLength={MAX_CHAMPION_NOTE_LENGTH}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {note.length}/{MAX_CHAMPION_NOTE_LENGTH}
            </Text>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!note.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={note.trim() && !isSubmitting ? GRADIENTS.gold : ['#2A3A4A', '#1E2B3A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              <Text style={[
                styles.submitText,
                (!note.trim() || isSubmitting) && styles.submitTextDisabled,
              ]}>
                {isSubmitting ? 'Posting...' : 'Post to the Wall'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity onPress={onDismiss} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          <Text style={styles.encouragement}>
            The kingdom awaits your wisdom, champion!
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'],
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.cardHigh,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textTertiary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  trophyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F5A623',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  leagueEmoji: {
    fontSize: 36,
    marginVertical: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  submitBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['3xl'],
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  submitTextDisabled: {
    color: COLORS.textTertiary,
  },
  skipBtn: {
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  skipText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  encouragement: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
});
