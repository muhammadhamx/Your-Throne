import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { getMyLeagues, getLeagueLeaderboard } from '@/lib/database';
import type { League, LeagueLeaderboardEntry } from '@/types/database';
import { COLORS, SHADOWS } from '@/utils/constants';

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

      // Pick first league and get leaderboard
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
          <Text style={styles.ctaEmoji}>🏰</Text>
          <View style={styles.ctaInfo}>
            <Text style={styles.ctaTitle}>Throne Leagues</Text>
            <Text style={styles.ctaText}>
              Create or join a league to compete with friends
            </Text>
          </View>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(250).springify().damping(18)}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/leagues/${league.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.row}>
          <Text style={styles.emoji}>{league.emoji}</Text>
          <View style={styles.info}>
            <Text style={styles.leagueName} numberOfLines={1}>
              {league.name}
            </Text>
            <Text style={styles.rankText}>
              {rank
                ? `#${rank} of ${memberCount} this week`
                : `${memberCount} members`}
            </Text>
          </View>
          {rank && (
            <View style={styles.rankBadge}>
              <Text style={styles.rankNumber}>#{rank}</Text>
            </View>
          )}
        </View>
        {weeklyXP > 0 && (
          <View style={styles.xpRow}>
            <Text style={styles.xpText}>{weeklyXP} XP this week</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  rankText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.accent,
  },
  xpRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  xpText: {
    fontSize: 12,
    color: COLORS.accentWarm,
    fontWeight: '600',
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.card,
  },
  ctaEmoji: {
    fontSize: 28,
  },
  ctaInfo: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  ctaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ctaArrow: {
    fontSize: 18,
    color: COLORS.textLight,
  },
});
