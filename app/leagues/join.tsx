import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore';
import { COLORS, SHADOWS, GRADIENTS, SPACING, RADIUS, LEAGUE_JOIN_CODE_LENGTH } from '@/utils/constants';

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

  const canJoin = !isLoading && code.trim().length >= LEAGUE_JOIN_CODE_LENGTH;
  const progress = Math.min(code.length / LEAGUE_JOIN_CODE_LENGTH, 1);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Join League',
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 17, color: COLORS.text },
        }}
      />

      <View style={styles.content}>
        {/* Icon + heading */}
        <Animated.View entering={FadeInDown.delay(50).springify().damping(18)} style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="key" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.heading}>Enter League Code</Text>
          <Text style={styles.hint}>
            Ask the league creator for their 6-character invite code
          </Text>
        </Animated.View>

        {/* Code input card */}
        <Animated.View entering={FadeInDown.delay(120).springify().damping(18)} style={styles.card}>
          <TextInput
            style={[styles.codeInput, code.length === LEAGUE_JOIN_CODE_LENGTH && styles.codeInputFull]}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            placeholder="_ _ _ _ _ _"
            placeholderTextColor={COLORS.textTertiary}
            maxLength={LEAGUE_JOIN_CODE_LENGTH}
            autoCapitalize="characters"
            autoFocus
            textAlign="center"
            autoCorrect={false}
          />

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {Array.from({ length: LEAGUE_JOIN_CODE_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < code.length && styles.dotFilled,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Join button */}
        <Animated.View entering={FadeInUp.delay(200).springify().damping(18)}>
          <TouchableOpacity
            style={[styles.joinButton, !canJoin && styles.disabled]}
            onPress={handleJoin}
            disabled={!canJoin}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canJoin ? GRADIENTS.button : ['#2A2A3A', '#2A2A3A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinGradient}
            >
              {isLoading ? (
                <Text style={styles.joinButtonText}>Joining...</Text>
              ) : (
                <>
                  <Ionicons
                    name="enter-outline"
                    size={20}
                    color={canJoin ? COLORS.primaryDark : COLORS.textTertiary}
                  />
                  <Text style={[styles.joinButtonText, !canJoin && styles.disabledText]}>
                    Join League
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(300).duration(400)}
          style={styles.footerNote}
        >
          League codes are case-insensitive. You must be invited to join a private league.
        </Animated.Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    paddingTop: SPACING.xl,
    gap: SPACING.md,
  },
  heroSection: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent + '30',
    marginBottom: SPACING.xs,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  codeInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    backgroundColor: COLORS.surfaceElevated,
    letterSpacing: 10,
    textAlign: 'center',
  },
  codeInputFull: {
    borderColor: COLORS.accent,
    color: COLORS.accent,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
  },
  dotFilled: {
    backgroundColor: COLORS.accent,
  },
  joinButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  joinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  joinButtonText: {
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
    fontStyle: 'italic',
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
});
