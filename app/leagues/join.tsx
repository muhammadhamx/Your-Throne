import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore';
import { COLORS, SHADOWS, LEAGUE_JOIN_CODE_LENGTH } from '@/utils/constants';

export default function JoinLeagueScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const join = useLeagueStore((s) => s.join);
  const isLoading = useLeagueStore((s) => s.isLoading);
  const [code, setCode] = useState('');

  const handleJoin = async () => {
    if (!userId) return;
    if (code.trim().length < LEAGUE_JOIN_CODE_LENGTH) {
      Alert.alert('Error', `Enter a ${LEAGUE_JOIN_CODE_LENGTH}-character league code.`);
      return;
    }

    try {
      const leagueId = await join(userId, code.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/leagues/${leagueId}`);
    } catch {
      Alert.alert('Invalid Code', 'No league found with that code. Check and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Join League' }} />

      <View style={styles.card}>
        <Text style={styles.heading}>Enter League Code</Text>
        <Text style={styles.hint}>
          Ask the league creator for the 6-character code
        </Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          placeholder="ABC123"
          placeholderTextColor={COLORS.textLight}
          maxLength={LEAGUE_JOIN_CODE_LENGTH}
          autoCapitalize="characters"
          autoFocus
          textAlign="center"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.joinButton,
          (isLoading || code.trim().length < LEAGUE_JOIN_CODE_LENGTH) && styles.disabled,
        ]}
        onPress={handleJoin}
        disabled={isLoading || code.trim().length < LEAGUE_JOIN_CODE_LENGTH}
        activeOpacity={0.8}
      >
        <Text style={styles.joinButtonText}>
          {isLoading ? 'Joining...' : 'Join League'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    backgroundColor: COLORS.surfaceElevated,
    letterSpacing: 8,
  },
  joinButton: {
    marginTop: 20,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  joinButtonText: {
    color: COLORS.primaryDark,
    fontSize: 17,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
