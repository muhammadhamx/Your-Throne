import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StreakFlame } from '@/components/ui/StreakFlame';
import { getNextMilestone } from '@/gamification/streaks';
import { useStatsStore } from '@/stores/statsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';

function isStreakAtRisk(streak: number, lastDate: string, sessions: Array<{ started_at: string }>): boolean {
  if (streak <= 0) return false;
  const today = new Date().toISOString().slice(0, 10);
  const hasSessionToday = sessions.some((s) => s.started_at.slice(0, 10) === today);
  if (hasSessionToday) return false;
  const hour = new Date().getHours();
  return hour >= 18;
}

export function StreakCard() {
  const streak = useStatsStore((s) => s.data?.streak ?? 0);
  const freezesRemaining = useGamificationStore((s) => s.streak.freezesRemaining);
  const streakLastDate = useGamificationStore((s) => s.streak.lastDate);
  const sessions = useSessionStore((s) => s.sessions);
  const nextMilestone = getNextMilestone(streak);

  const atRisk = useMemo(
    () => isStreakAtRisk(streak, streakLastDate, sessions),
    [streak, streakLastDate, sessions]
  );

  const hasStreak = streak > 0;

  const pulse = useSharedValue(1);
  if (atRisk) {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
    );
  }
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(500).springify()}
      style={[styles.card, atRisk && styles.cardAtRisk]}
    >
      {/* Left accent bar */}
      {hasStreak && (
        <LinearGradient
          colors={atRisk
            ? ['#F87171', '#E55858'] as const
            : ['#FF6B35', COLORS.accent] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.accentBar}
        />
      )}

      <View style={[styles.content, hasStreak && styles.contentWithBar]}>
        {/* Left: flame + streak info */}
        <View style={styles.leftSection}>
          <StreakFlame streak={streak} size="large" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>
              {streak}
              <Text style={styles.streakUnit}> day{streak !== 1 ? 's' : ''}</Text>
            </Text>
            <View style={styles.subtitleRow}>
              {atRisk ? (
                <Animated.View style={[styles.riskBadge, pulseStyle]}>
                  <Text style={styles.riskText}>Streak at risk!</Text>
                </Animated.View>
              ) : (
                <Text style={styles.streakLabel}>
                  {streak === 0 ? 'Start your streak today!' : 'Current streak'}
                </Text>
              )}
              {freezesRemaining > 0 && (
                <View style={styles.freezeBadge}>
                  <Text style={styles.freezeText}>🛡️ {freezesRemaining}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right: next milestone */}
        {nextMilestone && hasStreak && (
          <View style={styles.milestoneBox}>
            <Text style={styles.milestoneEmoji}>{nextMilestone.emoji}</Text>
            <Text style={styles.milestoneDays}>{nextMilestone.days}d</Text>
            <View style={styles.milestoneXPBadge}>
              <Text style={styles.milestoneXP}>+{nextMilestone.xpBonus}</Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  cardAtRisk: {
    borderColor: COLORS.error + '40',
  },
  accentBar: {
    width: 3,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  contentWithBar: {
    paddingLeft: SPACING.sm + 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  streakUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  streakLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.errorBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.error + '35',
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  freezeBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  freezeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  milestoneBox: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    minWidth: 60,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  milestoneEmoji: {
    fontSize: 18,
  },
  milestoneDays: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },
  milestoneXPBadge: {
    marginTop: 3,
  },
  milestoneXP: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
  },
});
