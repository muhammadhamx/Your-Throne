import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore';
import {
  COLORS,
  SHADOWS,
  GRADIENTS,
  SPACING,
  RADIUS,
  MAX_LEAGUE_NAME_LENGTH,
  MAX_LEAGUE_DESCRIPTION_LENGTH,
  LEAGUE_EMOJI_OPTIONS,
} from '@/utils/constants';

export default function CreateLeagueScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const create = useLeagueStore((s) => s.create);
  const isLoading = useLeagueStore((s) => s.isLoading);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏆');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!userId) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a league name.');
      return;
    }

    try {
      const league = await create(userId, name, emoji, description || undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        `${emoji} League Created!`,
        `Share this code with friends to join:\n\n${league.join_code}`,
        [
          {
            text: 'Copy Code',
            onPress: () => {
              Clipboard.setStringAsync(league.join_code);
            },
          },
          {
            text: 'Go to League',
            onPress: () => {
              router.replace(`/leagues/${league.id}`);
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to create league. Try again.');
    }
  };

  const canCreate = !isLoading && name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Create League',
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 17, color: COLORS.text },
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview header */}
        <Animated.View entering={FadeInDown.delay(50).springify().damping(18)} style={styles.preview}>
          <View style={styles.previewEmojiCircle}>
            <Text style={styles.previewEmoji}>{emoji}</Text>
          </View>
          <Text style={styles.previewName} numberOfLines={1}>
            {name.trim() || 'Your League Name'}
          </Text>
          {description.trim() ? (
            <Text style={styles.previewDesc} numberOfLines={2}>
              {description}
            </Text>
          ) : (
            <Text style={styles.previewDescPlaceholder}>No description</Text>
          )}
        </Animated.View>

        {/* Form card */}
        <Animated.View entering={FadeInDown.delay(120).springify().damping(18)} style={styles.card}>
          {/* Name input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>League Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="trophy-outline" size={16} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. The Royal Flush"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={MAX_LEAGUE_NAME_LENGTH}
                autoFocus
              />
              {name.length > 0 && (
                <Text style={styles.charCount}>{name.length}/{MAX_LEAGUE_NAME_LENGTH}</Text>
              )}
            </View>
          </View>

          {/* Emoji picker */}
          <View style={[styles.fieldGroup, { marginTop: SPACING.md }]}>
            <Text style={styles.label}>Choose Emoji</Text>
            <View style={styles.emojiGrid}>
              {LEAGUE_EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiButton, emoji === e && styles.emojiSelected]}
                  onPress={() => setEmoji(e)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description input */}
          <View style={[styles.fieldGroup, { marginTop: SPACING.md }]}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.optional}>optional</Text>
            </View>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What's your league about?"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={MAX_LEAGUE_DESCRIPTION_LENGTH}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </Animated.View>

        {/* Create button */}
        <Animated.View entering={FadeInDown.delay(200).springify().damping(18)}>
          <TouchableOpacity
            style={[styles.createButton, !canCreate && styles.disabled]}
            onPress={handleCreate}
            disabled={!canCreate}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canCreate ? GRADIENTS.button : ['#2A2A3A', '#2A2A3A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createGradient}
            >
              {isLoading ? (
                <Text style={styles.createButtonText}>Creating...</Text>
              ) : (
                <>
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={canCreate ? COLORS.primaryDark : COLORS.textTertiary}
                  />
                  <Text style={[styles.createButtonText, !canCreate && styles.disabledText]}>
                    Create League
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerNote}>
          A unique 6-character join code will be generated for your league.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
  preview: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent + '25',
    ...SHADOWS.card,
  },
  previewEmojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.accent + '30',
  },
  previewEmoji: {
    fontSize: 30,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  previewDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
  },
  previewDescPlaceholder: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
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
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 72,
    paddingVertical: SPACING.xs,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginLeft: SPACING.xs,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  emojiButton: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '15',
  },
  emojiText: {
    fontSize: 22,
  },
  createButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  createButtonText: {
    color: COLORS.primaryDark,
    fontSize: 16,
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
  footerNote: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
