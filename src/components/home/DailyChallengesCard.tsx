import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getDailyChallenges, type DailyChallenge } from '@/gamification/challenges';
import { COLORS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';

export function DailyChallengesCard() {
  const { dailyChallenges, loadDailyChallenges } = useGamificationStore();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [expanded, setExpanded] = useState(false);
  const expandHeight = useSharedValue(0);

  useEffect(() => {
    loadDailyChallenges().then(setChallenges);
  }, [loadDailyChallenges]);

  const completedCount = dailyChallenges?.completed.length ?? 0;
  const totalCount = challenges.length;
  const allDone = totalCount > 0 && completedCount >= totalCount;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const animatedExpandStyle = useAnimatedStyle(() => ({
    height: withTiming(expandHeight.value, { duration: 280 }),
    overflow: 'hidden' as const,
  }));

  const toggleExpand = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    expandHeight.value = newExpanded ? totalCount * 60 + 16 : 0;
  };

  if (challenges.length === 0) return null;

  const progressBarWidth = `${Math.round(progress * 100)}%`;

  return (
    <Animated.View
      entering={FadeInDown.delay(150).duration(500).springify()}
      style={styles.card}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, allDone && styles.iconCircleDone]}>
            <Text style={styles.headerEmoji}>{allDone ? '🎉' : '🎯'}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Daily Challenges</Text>
            <Text style={styles.headerSub}>
              {allDone ? 'All done! Keep it up.' : `${completedCount} of ${totalCount} complete`}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Compact progress indicator */}
          <View style={styles.countBadge}>
            <Text style={[styles.countText, allDone && styles.countTextDone]}>
              {completedCount}/{totalCount}
            </Text>
          </View>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: progressBarWidth as any },
            allDone && styles.progressFillDone,
          ]}
        />
      </View>

      {/* Expandable challenge list */}
      <Animated.View style={animatedExpandStyle}>
        <View style={styles.challengeList}>
          {challenges.map((challenge, i) => {
            const done = dailyChallenges?.completed.includes(challenge.id) ?? false;
            return (
              <View
                key={challenge.id}
                style={[
                  styles.challengeRow,
                  i < challenges.length - 1 && styles.challengeBorder,
                ]}
              >
                <View style={[styles.checkCircle, done && styles.checkCircleDone]}>
                  {done && <Text style={styles.checkMark}>✓</Text>}
                </View>

                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, done && styles.challengeTitleDone]}>
                    {challenge.emoji} {challenge.title}
                  </Text>
                  <Text style={styles.challengeDesc}>{challenge.description}</Text>
                </View>

                <View style={[styles.xpPill, done && styles.xpPillDone]}>
                  <Text style={[styles.xpPillText, done && styles.xpPillTextDone]}>
                    +{challenge.xpReward} XP
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '20',
  },
  iconCircleDone: {
    backgroundColor: COLORS.success + '18',
    borderColor: COLORS.success + '25',
  },
  headerEmoji: {
    fontSize: 17,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  countBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  countTextDone: {
    color: COLORS.success,
  },
  chevron: {
    fontSize: 9,
    color: COLORS.textTertiary,
    marginLeft: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  progressFillDone: {
    backgroundColor: COLORS.success,
  },
  challengeList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: SPACING.sm,
  },
  challengeBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkCircleDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkMark: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '800',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  challengeTitleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textTertiary,
  },
  challengeDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  xpPill: {
    backgroundColor: COLORS.accent + '18',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  xpPillDone: {
    backgroundColor: COLORS.success + '18',
  },
  xpPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
  },
  xpPillTextDone: {
    color: COLORS.success,
  },
});
