import { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { BarChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { useStatsStore, type StatsPeriod } from '@/stores/statsStore';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { formatDuration, formatHour } from '@/utils/formatters';
import { getRandomItem, EMPTY_STATE_MESSAGES } from '@/humor/jokes';
import { analyzeHealth, getOverallStatus, HEALTH_DISCLAIMER } from '@/health/insights';
import { WeeklyComparison } from '@/components/home/WeeklyComparison';
import { WeeklyRecapCard } from '@/components/home/WeeklyRecapCard';
import { LeaderboardCard } from '@/components/home/LeaderboardCard';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';

const PERIODS: { key: StatsPeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All Time' },
];

export default function StatsScreen() {
  const user = useAuthStore((s) => s.user);
  const { period, data, isLoading, setPeriod, loadStats } = useStatsStore();
  const sessions = useSessionStore((s) => s.sessions);

  const refresh = useCallback(() => {
    if (user?.id) loadStats(user.id);
  }, [user?.id, loadStats]);

  useEffect(() => {
    refresh();
  }, [refresh, period]);

  const healthInsights = useMemo(() => analyzeHealth(sessions), [sessions]);
  const overallHealth = useMemo(() => getOverallStatus(healthInsights), [healthInsights]);

  const statItems = data ? [
    { emoji: '🚽', label: 'Sessions', value: data.totalSessions.toString(), accent: COLORS.accent },
    { emoji: '⏱️', label: 'Total Time', value: formatDuration(data.totalDuration), accent: COLORS.primaryLight },
    { emoji: '📏', label: 'Average', value: formatDuration(data.avgDuration), accent: COLORS.accentWarm },
    { emoji: '🏆', label: 'Longest', value: formatDuration(data.longestSession), accent: '#818CF8' },
    { emoji: '🔥', label: 'Streak', value: `${data.streak} day${data.streak !== 1 ? 's' : ''}`, accent: '#FF6B35' },
  ] : [];

  if (!data || data.totalSessions === 0) {
    return (
      <View style={styles.container}>
        <PeriodSelector period={period} onSelect={setPeriod} />
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyText}>
            {getRandomItem(EMPTY_STATE_MESSAGES.stats)}
          </Text>
        </Animated.View>
      </View>
    );
  }

  const barData = data.hourlyDistribution
    .filter((h) => h.count > 0)
    .map((h) => ({
      value: h.count,
      label: h.hour % 6 === 0 ? formatHour(h.hour) : '',
      frontColor: COLORS.accent,
      gradientColor: COLORS.accentLight,
    }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          tintColor={COLORS.accent}
          colors={[COLORS.accent]}
        />
      }
    >
      <PeriodSelector period={period} onSelect={setPeriod} />

      {/* Stats grid */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500).springify()}
        style={styles.statsGrid}
      >
        {statItems.map((item, i) => (
          <Animated.View
            key={item.label}
            entering={FadeInDown.delay(80 + i * 50).duration(400).springify()}
            style={styles.statCard}
          >
            <View style={[styles.statIconCircle, { backgroundColor: item.accent + '16' }]}>
              <Text style={styles.statEmoji}>{item.emoji}</Text>
            </View>
            <Text style={[styles.statValue, { color: item.accent }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Time of day chart */}
      {barData.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(350).duration(500).springify()}
          style={styles.chartCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Time of Day</Text>
            <Text style={styles.cardSubtitle}>When you usually go</Text>
          </View>
          <BarChart
            data={barData}
            barWidth={10}
            spacing={5}
            roundedTop
            roundedBottom
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={COLORS.border}
            yAxisTextStyle={{ color: COLORS.textTertiary, fontSize: 9 }}
            xAxisLabelTextStyle={{ color: COLORS.textTertiary, fontSize: 9 }}
            height={140}
            isAnimated
            barBorderRadius={4}
          />
        </Animated.View>
      )}

      {/* Health Insights */}
      {healthInsights.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(450).duration(500).springify()}
          style={styles.healthCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.healthHeaderLeft}>
              <View style={[
                styles.healthDot,
                overallHealth === 'green' && { backgroundColor: COLORS.success },
                overallHealth === 'yellow' && { backgroundColor: COLORS.warning },
                overallHealth === 'red' && { backgroundColor: COLORS.error },
              ]} />
              <Text style={styles.cardTitle}>Health Insights</Text>
            </View>
            <View style={[
              styles.healthStatusBadge,
              overallHealth === 'green' && styles.healthBadgeGreen,
              overallHealth === 'yellow' && styles.healthBadgeYellow,
              overallHealth === 'red' && styles.healthBadgeRed,
            ]}>
              <Text style={styles.healthStatusText}>
                {overallHealth === 'green' ? 'Healthy' : overallHealth === 'yellow' ? 'Monitor' : 'Concern'}
              </Text>
            </View>
          </View>

          {healthInsights.map((insight, i) => (
            <View key={i} style={[styles.insightRow, i > 0 && styles.insightBorder]}>
              <View style={styles.insightEmojiCircle}>
                <Text style={styles.insightEmoji}>{insight.emoji}</Text>
              </View>
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMsg}>{insight.message}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.disclaimer}>{HEALTH_DISCLAIMER}</Text>
        </Animated.View>
      )}

      {/* Relocated from home screen */}
      <WeeklyComparison />
      <WeeklyRecapCard />
      <LeaderboardCard />
    </ScrollView>
  );
}

function PeriodSelector({ period, onSelect }: { period: StatsPeriod; onSelect: (p: StatsPeriod) => void }) {
  return (
    <View style={styles.periodContainer}>
      {PERIODS.map((p) => (
        <TouchableOpacity
          key={p.key}
          style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
          onPress={() => onSelect(p.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
            {p.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING['2xl'],
  },
  periodContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  periodBtnActive: {
    backgroundColor: COLORS.accent,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  statCard: {
    width: '30.5%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statEmoji: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  healthCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  healthHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  healthStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  healthBadgeGreen: {
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  healthBadgeYellow: {
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  healthBadgeRed: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  healthStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  insightBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  insightEmojiCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightEmoji: {
    fontSize: 17,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  insightMsg: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: SPACING['2xl'],
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
