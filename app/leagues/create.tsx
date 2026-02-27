import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore';
import {
  COLORS,
  SHADOWS,
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Create League' }} />

      <View style={styles.card}>
        <Text style={styles.label}>League Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. The Royal Flush"
          placeholderTextColor={COLORS.textLight}
          maxLength={MAX_LEAGUE_NAME_LENGTH}
          autoFocus
        />

        <Text style={[styles.label, { marginTop: 20 }]}>League Emoji</Text>
        <View style={styles.emojiGrid}>
          {LEAGUE_EMOJI_OPTIONS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.emojiButton, emoji === e && styles.emojiSelected]}
              onPress={() => setEmoji(e)}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>
          Description{' '}
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What's your league about?"
          placeholderTextColor={COLORS.textLight}
          maxLength={MAX_LEAGUE_DESCRIPTION_LENGTH}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.createButton, (isLoading || !name.trim()) && styles.disabled]}
        onPress={handleCreate}
        disabled={isLoading || !name.trim()}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>
          {isLoading ? 'Creating...' : 'Create League'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  optional: {
    fontWeight: '400',
    color: COLORS.textLight,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceElevated,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    fontSize: 24,
  },
  createButton: {
    marginTop: 20,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  createButtonText: {
    color: COLORS.primaryDark,
    fontSize: 17,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
