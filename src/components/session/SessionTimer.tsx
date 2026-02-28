import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '@/stores/sessionStore';
import { formatTimerDisplay } from '@/utils/formatters';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING, ANIMATION } from '@/utils/constants';

interface Props {
  onStart: () => void;
  onStop: () => void;
}

export function SessionTimer({ onStart, onStop }: Props) {
  const isActive = useSessionStore((s) => s.isActive);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);

  const buttonScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const pulseRing = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Breathing glow
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      );
      // Expanding ring
      pulseRing.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
        ),
        -1,
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 350 });
      pulseRing.value = withTiming(0, { duration: 350 });
    }
  }, [isActive, glowOpacity, pulseRing]);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.94, ANIMATION.springSnappy);
  };
  const handlePressOut = () => {
    buttonScale.value = withSpring(1, ANIMATION.spring);
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isActive) onStop();
    else onStart();
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const glowRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseRing.value, [0, 0.3, 1], [0, 0.5, 0]),
    transform: [
      { scale: interpolate(pulseRing.value, [0, 1], [1, 1.4]) },
    ],
  }));

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Timer display */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>
          {isActive ? 'SESSION IN PROGRESS' : 'READY TO GO?'}
        </Text>
        <Text style={[styles.timerDisplay, isActive && styles.timerDisplayActive]}>
          {formatTimerDisplay(elapsedSeconds)}
        </Text>
        <Text style={styles.timerHint}>
          {isActive
            ? 'Tap the button when you\'re done'
            : 'Tap when you sit on the throne'}
        </Text>
      </View>

      {/* Button area with rings */}
      <View style={styles.buttonArea}>
        {/* Expanding pulse ring (only when active) */}
        {isActive && (
          <Animated.View style={[styles.pulseRing, glowRingStyle]} />
        )}

        {/* Steady inner glow ring */}
        {isActive && (
          <Animated.View style={[styles.innerGlowRing, innerGlowStyle]} />
        )}

        {/* Main button */}
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={buttonAnimatedStyle}>
            <LinearGradient
              colors={isActive ? GRADIENTS.buttonDanger : GRADIENTS.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonEmoji}>
                {isActive ? '⏹' : '🚽'}
              </Text>
              <Text style={[styles.buttonText, isActive && styles.buttonTextStop]}>
                {isActive ? 'End Session' : 'Start Session'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  timerDisplay: {
    fontSize: 68,
    fontWeight: '200',
    color: COLORS.textTertiary,
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
    lineHeight: 78,
  },
  timerDisplayActive: {
    color: COLORS.accent,
    fontWeight: '300',
  },
  timerHint: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  buttonArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 270,
    height: 82,
  },
  pulseRing: {
    position: 'absolute',
    width: 270,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
  },
  innerGlowRing: {
    position: 'absolute',
    width: 270,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '08',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: SPACING['2xl'] + SPACING.lg,
    borderRadius: 40,
    minWidth: 250,
    gap: SPACING.sm,
    ...SHADOWS.glow,
  },
  buttonEmoji: {
    fontSize: 22,
  },
  buttonText: {
    color: COLORS.primaryDark,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  buttonTextStop: {
    color: '#FFFFFF',
  },
});
