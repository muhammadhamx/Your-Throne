import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getSessionsByDateRange } from '@/lib/database';
import { formatDuration } from '@/utils/formatters';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

interface WeeklyStats {
  sessions: number;
  totalDuration: number;
  avgDuration: number;
  longestSession: number;
  mostActiveHour: number;
  bestDay: string;
  bestDayCount: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getLastWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() - dayOfWeek);
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 7);
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export function WeeklyRecapCard() {
  const userId = useAuthStore((s) => s.user?.id);
  const streak = useGamificationStore((s) => s.streak);
  const xp = useGamificationStore((s) => s.xp);
  const rank = useGamificationStore((s) => s.rank);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    if (!userId) return;

    const dayOfWeek = new Date().getDay();
    if (dayOfWeek > 2) return;

    const { start, end } = getLastWeekRange();
    getSessionsByDateRange(userId, start, end).then((sessions) => {
      if (sessions.length === 0) return;

      const durations = sessions
        .filter((s) => s.duration_seconds)
        .map((s) => s.duration_seconds!);
      const totalDuration = durations.reduce((a, b) => a + b, 0);
      const avgDuration = Math.round(totalDuration / durations.length);
      const longestSession = Math.max(...durations);

      const hourCounts: Record<number, number> = {};
      for (const s of sessions) {
        const hour = new Date(s.started_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
      const mostActiveHour = Object.entries(hourCounts).sort(
        ([, a], [, b]) => b - a
      )[0];

      const dayCounts: Record<number, number> = {};
      for (const s of sessions) {
        const day = new Date(s.started_at).getDay();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
      const bestDayEntry = Object.entries(dayCounts).sort(
        ([, a], [, b]) => b - a
      )[0];

      setStats({
        sessions: sessions.length,
        totalDuration,
        avgDuration,
        longestSession,
        mostActiveHour: parseInt(mostActiveHour[0], 10),
        bestDay: DAY_NAMES[parseInt(bestDayEntry[0], 10)],
        bestDayCount: bestDayEntry[1],
      });
    }).catch(() => {});
  }, [userId]);

  const handleShare = useCallback(async () => {
    if (!viewShotRef.current?.capture) return;
    setIsSharing(true);
    try {
      const uri = await viewShotRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Royal Throne recap',
        });
      }
    } catch {
      // Silent fail
    } finally {
      setIsSharing(false);
    }
  }, []);

  if (!stats) return null;

  const statsGrid = [
    { label: 'Sessions', value: String(stats.sessions) },
    { label: 'Total Time', value: formatDuration(stats.totalDuration) },
    { label: 'Average', value: formatDuration(stats.avgDuration) },
    { label: 'Longest', value: formatDuration(stats.longestSession) },
  ];

  const extraStats = [
    { emoji: rank.emoji, value: xp.toLocaleString(), label: 'Total XP' },
    { emoji: '🔥', value: String(streak.count), label: 'Day Streak' },
    { emoji: '📅', value: stats.bestDay, label: 'Best Day' },
  ];

  const recapContent = (
    <View style={styles.cardInner}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconCircle}>
          <Ionicons name="bar-chart" size={18} color={COLORS.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Last Week's Royal Throne Report</Text>
          <Text style={styles.headerSub}>Your weekly recap is here</Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {statsGrid.map((item, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Extra row */}
      <View style={styles.extraRow}>
        {extraStats.map((item, i) => (
          <View key={i} style={[styles.extraItem, i < extraStats.length - 1 && styles.extraItemBorder]}>
            <Text style={styles.extraEmoji}>{item.emoji}</Text>
            <Text style={styles.extraValue}>{item.value}</Text>
            <Text style={styles.extraLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Fun fact */}
      <View style={styles.funFact}>
        <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
        <Text style={styles.funFactText}>
          Most active around {formatHour(stats.mostActiveHour)} · {stats.bestDayCount} sessions on {stats.bestDay}
        </Text>
      </View>
    </View>
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(250).springify().damping(18)}
      style={styles.container}
    >
      {/* Visible card */}
      {recapContent}

      {/* Share button */}
      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={isSharing}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSharing ? 'hourglass-outline' : 'share-outline'}
            size={15}
            color={COLORS.accent}
          />
          <Text style={styles.shareText}>
            {isSharing ? 'Saving...' : 'Share Recap'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Hidden shareable version with branding (off-screen capture) */}
      <View style={styles.offscreen} pointerEvents="none">
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1 }}
        >
          <View style={styles.shareCard}>
            <LinearGradient
              colors={GRADIENTS.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareBrand}
            >
              <Text style={styles.shareBrandEmoji}>🚽</Text>
              <Text style={styles.shareBrandText}>Royal Throne</Text>
            </LinearGradient>
            {recapContent}
            <View style={styles.shareFooter}>
              <Text style={styles.shareFooterText}>
                Track your throne sessions — download Royal Throne
              </Text>
            </View>
          </View>
        </ViewShot>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent + '25',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardInner: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '25',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  statItem: {
    width: '50%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.accent,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  extraItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: 2,
  },
  extraItemBorder: {
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  extraEmoji: {
    fontSize: 16,
  },
  extraValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  extraLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  funFact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  funFactText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  shareText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  // Off-screen container for ViewShot capture
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  shareCard: {
    width: 360,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
  },
  shareBrandEmoji: {
    fontSize: 24,
  },
  shareBrandText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 1,
  },
  shareFooter: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
  },
  shareFooterText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
});
