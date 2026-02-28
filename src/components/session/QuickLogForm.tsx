import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS, MAX_SESSION_DURATION_SECONDS } from '@/utils/constants';

interface Props {
  onSubmit: (startedAt: string, durationSeconds: number, notes?: string) => Promise<void>;
}

export function QuickLogForm({ onSubmit }: Props) {
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins < 1) {
      Alert.alert('Invalid duration', 'Please enter at least 1 minute.');
      return;
    }

    const durationSeconds = mins * 60;
    if (durationSeconds > MAX_SESSION_DURATION_SECONDS) {
      Alert.alert('Too long', 'Maximum session duration is 3 hours.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startedAt = new Date(
        Date.now() - durationSeconds * 1000
      ).toISOString();
      await onSubmit(startedAt, durationSeconds, notes || undefined);
      setMinutes('');
      setNotes('');
      Alert.alert('Logged!', 'Session added to your history.');
    } catch {
      Alert.alert('Error', 'Failed to log session. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !isSubmitting && minutes.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIconCircle}>
          <Ionicons name="pencil" size={14} color={COLORS.accent} />
        </View>
        <View>
          <Text style={styles.title}>Quick Log</Text>
          <Text style={styles.subtitle}>Log a recent session manually</Text>
        </View>
      </View>

      <View style={styles.fields}>
        {/* Duration input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="time-outline" size={16} color={COLORS.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={3}
              returnKeyType="done"
            />
            {minutes.length > 0 && (
              <Text style={styles.inputSuffix}>min</Text>
            )}
          </View>
        </View>

        {/* Notes input */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.optional}>optional</Text>
          </View>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={COLORS.textTertiary}
              style={[styles.inputIcon, { marginTop: 1 }]}
            />
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How was it?"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={200}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.disabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={canSubmit ? GRADIENTS.button : ['#2A2A3A', '#2A2A3A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={canSubmit ? COLORS.primaryDark : COLORS.textTertiary}
          />
          <Text style={[styles.submitText, !canSubmit && styles.disabledText]}>
            {isSubmitting ? 'Logging...' : 'Log Session'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '25',
    flexShrink: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  fields: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  fieldGroup: {},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optional: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    textTransform: 'none',
    letterSpacing: 0,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.sm,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  inputIcon: {
    marginRight: SPACING.xs,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
  },
  notesInput: {
    height: 60,
    paddingVertical: SPACING.xs,
    textAlignVertical: 'top',
  },
  inputSuffix: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  submitButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  submitText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: COLORS.textTertiary,
  },
});
