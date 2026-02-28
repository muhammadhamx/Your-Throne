import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { XPProgressBar } from '@/components/ui/XPProgressBar';
import { getGreeting } from '@/humor/greetings';
import { useGamificationStore } from '@/stores/gamificationStore';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY } from '@/utils/constants';

export function GreetingBanner() {
  const { rank, xpProgress } = useGamificationStore();
  const greeting = getGreeting();

  return (
    <Animated.View
      entering={FadeInDown.delay(50).duration(500).springify()}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={GRADIENTS.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        {/* Decorative accent circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        {/* Top row: greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextWrap}>
            <Text style={styles.greetingMessage}>{greeting.message}</Text>
          </View>
          <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
        </View>

        {/* Rank badge row */}
        <View style={styles.rankRow}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankEmoji}>{rank.emoji}</Text>
          </View>
          <View style={styles.rankDetails}>
            <Text style={styles.rankName}>{rank.name}</Text>
            <Text style={styles.rankDescription} numberOfLines={1}>
              {rank.description}
            </Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpRow}>
          <XPProgressBar
            current={xpProgress.current}
            needed={xpProgress.needed}
            percentage={xpProgress.percentage}
            showLabel={true}
            height={6}
            labelColor="rgba(240,246,255,0.55)"
            trackColor="rgba(255,255,255,0.08)"
            fillColor={COLORS.accentWarm}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.xl,
    ...SHADOWS.cardElevated,
  },
  banner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  circle1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(0,212,160,0.07)',
  },
  circle2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,212,160,0.04)',
  },
  circle3: {
    position: 'absolute',
    top: 20,
    right: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245,166,35,0.05)',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  greetingTextWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  greetingMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(240,246,255,0.85)',
    lineHeight: 22,
  },
  greetingEmoji: {
    fontSize: 30,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rankBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,212,160,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,212,160,0.22)',
  },
  rankEmoji: {
    fontSize: 22,
  },
  rankDetails: {
    flex: 1,
  },
  rankName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.2,
  },
  rankDescription: {
    fontSize: 12,
    color: 'rgba(240,246,255,0.4)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  xpRow: {
    marginTop: 2,
  },
});
