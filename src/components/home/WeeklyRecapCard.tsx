import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getSessionsByDateRange } from '@/lib/database';
import { formatDuration } from '@/utils/formatters';
import { COLORS, SHADOWS } from '@/utils/constants';

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

      // Most active hour
      const hourCounts: Record<number, number> = {};
      for (const s of sessions) {
        const hour = new Date(s.started_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
      const mostActiveHour = Object.entries(hourCounts).sort(
        ([, a], [, b]) => b - a
      )[0];

      // Best day of the week
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
          dialogTitle: 'Share your Throne recap',
        });
      }
    } catch {
      // Silent fail
    } finally {
      setIsSharing(false);
    }
  }, []);

  if (!stats) return null;

  const recapContent = (
    <View style={styles.cardInner}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📊</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Last Week's Throne Report</Text>
          <Text style={styles.headerSub}>Your weekly recap is here</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.sessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDuration(stats.avgDuration)}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDuration(stats.longestSession)}</Text>
          <Text style={styles.statLabel}>Longest</Text>
        </View>
      </View>

      {/* Extra stats row */}
      <View style={styles.extraRow}>
        <View style={styles.extraItem}>
          <Text style={styles.extraEmoji}>{rank.emoji}</Text>
          <Text style={styles.extraValue}>{xp.toLocaleString()}</Text>
          <Text style={styles.extraLabel}>Total XP</Text>
        </View>
        <View style={styles.extraDivider} />
        <View style={styles.extraItem}>
          <Text style={styles.extraEmoji}>🔥</Text>
          <Text style={styles.extraValue}>{streak.count}</Text>
          <Text style={styles.extraLabel}>Day Streak</Text>
        </View>
        <View style={styles.extraDivider} />
        <View style={styles.extraItem}>
          <Text style={styles.extraEmoji}>📅</Text>
          <Text style={styles.extraValue}>{stats.bestDay}</Text>
          <Text style={styles.extraLabel}>Best Day</Text>
        </View>
      </View>

      <View style={styles.funFact}>
        <Text style={styles.funFactText}>
          🕐 Most active around {formatHour(stats.mostActiveHour)} · {stats.bestDayCount} sessions on {stats.bestDay}
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
          <Text style={styles.shareText}>
            {isSharing ? 'Saving...' : '📤 Share Recap'}
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
            <View style={styles.shareBrand}>
              <Text style={styles.shareBrandEmoji}>🚽</Text>
              <Text style={styles.shareBrandText}>Throne</Text>
            </View>
            {recapContent}
            <View style={styles.shareFooter}>
              <Text style={styles.shareFooterText}>
                Track your throne sessions — download Throne
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
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.accent + '25',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardInner: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingBottom: 12,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 16,
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
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  statItem: {
    width: '50%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.accent,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  extraItem: {
    alignItems: 'center',
    flex: 1,
  },
  extraEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  extraValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  extraLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  extraDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  funFact: {
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  funFactText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  shareButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  shareText: {
    fontSize: 14,
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
    gap: 8,
    paddingVertical: 16,
    backgroundColor: COLORS.primaryDark,
  },
  shareBrandEmoji: {
    fontSize: 24,
  },
  shareBrandText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  shareFooter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
  },
  shareFooterText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
});
