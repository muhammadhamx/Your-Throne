import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatDuration } from '@/utils/formatters';
import { getSessionSummaryMessage } from '@/humor/jokes';
import type { SessionReward } from '@/gamification/rewards';
import { COLORS, SHADOWS, GRADIENTS, SPACING, RADIUS } from '@/utils/constants';

interface Props {
  visible: boolean;
  duration: number;
  reward: SessionReward;
  streak: number;
  onClose: () => void;
}

export function PostSessionSummary({ visible, duration, reward, streak, onClose }: Props) {
  const [summaryMessage] = useState(() => getSessionSummaryMessage(duration));
  const [showLucky, setShowLucky] = useState(false);
  const [showMystery, setShowMystery] = useState(false);

  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      setShowLucky(false);
      setShowMystery(false);
      return;
    }

    // Stagger the reveals
    if (reward.luckyPoop) {
      const t1 = setTimeout(() => {
        setShowLucky(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 800);
      if (reward.mysteryBox) {
        const t2 = setTimeout(() => {
          setShowMystery(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1600);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
      return () => clearTimeout(t1);
    } else if (reward.mysteryBox) {
      const t = setTimeout(() => {
        setShowMystery(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [visible, reward]);

  useEffect(() => {
    if (visible) {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1600 }),
          withTiming(0, { duration: 1600 }),
        ),
        -1,
      );
    }
  }, [visible, shimmer]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + shimmer.value * 0.35,
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      statusBarTranslucent
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
        <Animated.View entering={FadeInUp.delay(100).springify().damping(14)} style={styles.card}>
          {/* Pulsing glow ring */}
          <Animated.View style={[styles.glowRing, glowStyle]} />

          {/* Crown / emoji */}
          <Animated.Text entering={ZoomIn.delay(200).springify()} style={styles.bigEmoji}>
            {reward.luckyPoop ? reward.luckyPoop.emoji : '🎉'}
          </Animated.Text>

          {/* Duration */}
          <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={styles.duration}>
            {formatDuration(duration)}
          </Animated.Text>

          {/* Funny message */}
          <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={styles.message}>
            {summaryMessage}
          </Animated.Text>

          {/* XP Earned */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.xpContainer}>
            <LinearGradient
              colors={GRADIENTS.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.xpBadge}
            >
              <Ionicons name="star" size={16} color={COLORS.primaryDark} />
              <Text style={styles.xpText}>+{reward.totalXP} XP</Text>
            </LinearGradient>
            {reward.luckyPoop && (
              <Text style={styles.xpBreakdown}>
                {reward.baseXP} base × {reward.luckyPoop.multiplier}x multiplier
              </Text>
            )}
          </Animated.View>

          {/* Lucky Poop reveal */}
          {showLucky && reward.luckyPoop && (
            <Animated.View entering={ZoomIn.springify().damping(10)} style={styles.rewardRow}>
              <View style={styles.rewardEmojiCircle}>
                <Text style={styles.rewardEmoji}>{reward.luckyPoop.emoji}</Text>
              </View>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardLabel}>Lucky Poop!</Text>
                <Text style={styles.rewardDetail}>{reward.luckyPoop.label}</Text>
              </View>
            </Animated.View>
          )}

          {/* Mystery Box reveal */}
          {showMystery && reward.mysteryBox && (
            <Animated.View entering={ZoomIn.springify().damping(10)} style={styles.rewardRow}>
              <View style={styles.rewardEmojiCircle}>
                <Text style={styles.rewardEmoji}>{reward.mysteryBox.emoji}</Text>
              </View>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardLabel}>Mystery Box!</Text>
                <Text style={styles.rewardDetail}>{reward.mysteryBox.label}</Text>
              </View>
            </Animated.View>
          )}

          {/* Streak */}
          {streak > 0 && (
            <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.streakRow}>
              <View style={styles.streakIconCircle}>
                <Text style={styles.streakEmoji}>🔥</Text>
              </View>
              <Text style={styles.streakText}>{streak} day streak</Text>
            </Animated.View>
          )}

          {/* Close button */}
          <Animated.View entering={FadeInUp.delay(900).duration(400)} style={styles.closeWrapper}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={GRADIENTS.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeGradient}
              >
                <Text style={styles.closeText}>Noice!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    overflow: 'hidden',
    ...SHADOWS.cardElevated,
  },
  glowRing: {
    position: 'absolute',
    top: -48,
    left: -48,
    right: -48,
    bottom: -48,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  bigEmoji: {
    fontSize: 68,
    marginBottom: SPACING.sm,
  },
  duration: {
    fontSize: 46,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: -1.5,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.xs,
    lineHeight: 22,
    paddingHorizontal: SPACING.sm,
  },
  xpContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.glow,
  },
  xpText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  xpBreakdown: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.accent + '25',
  },
  rewardEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexShrink: 0,
  },
  rewardEmoji: {
    fontSize: 24,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accent,
  },
  rewardDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  streakIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeWrapper: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  closeButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  closeGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
});
