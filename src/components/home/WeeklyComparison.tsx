import { View, Text, StyleSheet } from 'react-native';
import { getComparison } from '@/humor/comparisons';
import { useStatsStore } from '@/stores/statsStore';
import { COLORS, SPACING, RADIUS } from '@/utils/constants';
import { Ionicons } from '@expo/vector-icons';

export function WeeklyComparison() {
  const totalDuration = useStatsStore((s) => s.data?.totalDuration ?? 0);
  const totalMinutes = Math.round(totalDuration / 60);

  const comparison = getComparison(totalMinutes);

  if (!comparison) return null;

  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        <View style={styles.iconCircle}>
          <Ionicons name="bar-chart-outline" size={12} color={COLORS.accent} />
        </View>
        <Text style={styles.minuteText}>{totalMinutes} min</Text>
        <View style={styles.separator} />
        <Text style={styles.comparisonText} numberOfLines={1}>
          {comparison}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    maxWidth: '100%',
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  minuteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    flexShrink: 0,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.borderLight,
    flexShrink: 0,
  },
  comparisonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
});
