import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '@/utils/constants';

interface XPProgressBarProps {
  current: number;
  needed: number;
  percentage: number;
  rankEmoji?: string;
  showLabel?: boolean;
  height?: number;
  labelColor?: string;
  trackColor?: string;
  fillColor?: string;
}

export function XPProgressBar({
  current,
  needed,
  percentage,
  rankEmoji,
  showLabel = true,
  height = 8,
  labelColor,
  trackColor,
  fillColor,
}: XPProgressBarProps) {
  const clampedPercent = Math.min(Math.max(percentage, 0), 100);

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          {rankEmoji && <Text style={styles.emoji}>{rankEmoji}</Text>}
          <Text style={[styles.xpText, labelColor ? { color: labelColor } : undefined]}>
            {current.toLocaleString()} / {needed.toLocaleString()} XP
          </Text>
          <View style={styles.percentBadge}>
            <Text style={[styles.percentText, labelColor ? { color: labelColor } : undefined]}>
              {Math.round(clampedPercent)}%
            </Text>
          </View>
        </View>
      )}
      <View
        style={[
          styles.track,
          { height },
          trackColor ? { backgroundColor: trackColor } : undefined,
        ]}
      >
        {fillColor ? (
          <View
            style={[
              styles.fill,
              { height, width: `${clampedPercent}%`, backgroundColor: fillColor },
            ]}
          />
        ) : (
          <LinearGradient
            colors={GRADIENTS.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { height, width: `${clampedPercent}%` }]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  emoji: {
    fontSize: 14,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  percentBadge: {
    backgroundColor: COLORS.accent + '18',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  track: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 100,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 100,
    backgroundColor: COLORS.accent,
  },
});
