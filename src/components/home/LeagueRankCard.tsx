import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { getMyLeagues, getLeagueLeaderboard } from '@/lib/database';
import type { League, LeagueLeaderboardEntry } from '@/types/database';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

export function LeagueRankCard() {
  const userId = useAuthStore((s) => s.user?.id);
  const [league, setLeague] = useState<League | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [weeklyXP, setWeeklyXP] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const leagues = await getMyLeagues(userId);
      if (leagues.length === 0) {
        setLeague(null);
        setLoading(false);
        return;
      }

      const topLeague = leagues[0];
      const lb = await getLeagueLeaderboard(topLeague.id);
      const myIndex = lb.findIndex((e) => e.user_id === userId);

      setLeague(topLeague);
      setMemberCount(lb.length);
      setRank(myIndex >= 0 ? myIndex + 1 : null);
      setWeeklyXP(myIndex >= 0 ? lb[myIndex].weekly_xp : 0);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;

  // No leagues — show CTA
  if (!league) {
    return (
      <Animated.View entering={FadeInDown.delay(250).springify().damping(18)}>
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push('/leagues/')}
          activeOpacity={0.8}
        >
          <View style={styles.ctaIconCircle}>
            <Text style={styles.ctaEmoji}>🏰</Text>
          </View>
          <View style={styles.ctaInfo}>
            <Text style={styles.ctaTitle}>Royal Throne Leagues</Text>
            <Text style={styles.ctaText}>
              Compete with friends in a private league
            </Text>
          </View>
          <View style={styles.arrowCircle}>
            <Ionicons name="chevron-forward" size={14} color={COLORS.accent} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const getRankLabel = () => {
    if (!rank) return null;
    if (rank === 1) return '👑 1st';
    if (rank === 2) return '🥈 2nd';
    if (rank === 3) return '🥉 3rd';
    return `#${rank}`;
  };

  return (
    <Animated.View entering={FadeInDown.delay(250).springify().damping(18)}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/leagues/${league.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.row}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>{league.emoji}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.leagueName} numberOfLines={1}>
              {league.name}
            </Text>
            <Text style={styles.rankText}>
              {rank
                ? `${getRankLabel()} of ${memberCount} this week`
                : `${memberCount} members`}
            </Text>
          </View>
          {rank && (
            <View style={[styles.rankBadge, rank <= 3 && styles.rankBadgeTop]}>
              <Text style={[styles.rankNumber, rank <= 3 && styles.rankNumberTop]}>
                {getRankLabel()}
              </Text>
            </View>
          )}
        </View>

        {weeklyXP > 0 && (
          <View style={styles.xpRow}>
            <Ionicons name="star" size={12} color={COLORS.accentWarm} />
            <Text style={styles.xpText}>{weeklyXP.toLocaleString()} XP this week</Text>
            <View style={styles.viewLeaguePill}>
              <Text style={styles.viewLeagueText}>View</Text>
              <Ionicons name="chevron-forward" size={10} color={COLORS.textTertiary} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexShrink: 0,
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  leagueName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  rankText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: COLORS.accent + '18',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    flexShrink: 0,
  },
  rankBadgeTop: {
    backgroundColor: COLORS.accentWarm + '18',
    borderColor: COLORS.accentWarm + '40',
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accent,
  },
  rankNumberTop: {
    color: COLORS.accentWarm,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceElevated,
  },
  xpText: {
    fontSize: 12,
    color: COLORS.accentWarm,
    fontWeight: '600',
    flex: 1,
  },
  viewLeaguePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewLeagueText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  ctaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexShrink: 0,
  },
  ctaEmoji: {
    fontSize: 22,
  },
  ctaInfo: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  ctaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '25',
    flexShrink: 0,
  },
});
