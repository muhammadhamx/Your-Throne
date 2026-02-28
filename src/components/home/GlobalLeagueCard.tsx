import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore';
import { COLORS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

export function GlobalLeagueCard() {
  const userId = useAuthStore((s) => s.user?.id);
  const { globalLeaderboard, leagues, loadGlobalLeaderboard } = useLeagueStore();
  const [loaded, setLoaded] = useState(false);

  const myLeagueIds = leagues.map((l) => l.id);

  useEffect(() => {
    loadGlobalLeaderboard().then(() => setLoaded(true));
  }, [loadGlobalLeaderboard]);

  if (!loaded || globalLeaderboard.length === 0) return null;

  const top3 = globalLeaderboard.slice(0, 3);
  const myLeagueEntry = globalLeaderboard.find((e) => myLeagueIds.includes(e.league_id));
  const myRank = myLeagueEntry
    ? globalLeaderboard.findIndex((e) => e.league_id === myLeagueEntry.league_id) + 1
    : null;

  const medals = ['🏆', '🥈', '🥉'];

  return (
    <Animated.View entering={FadeInDown.delay(300).springify().damping(18)}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/leagues/global')}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.swordEmoji}>⚔️</Text>
            <Text style={styles.title}>League Wars</Text>
          </View>
          <View style={styles.viewAllPill}>
            <Text style={styles.viewAllText}>Rankings</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.accent} />
          </View>
        </View>

        {/* Top 3 */}
        <View style={styles.rankingsContainer}>
          {top3.map((entry, i) => {
            const isMyLeague = myLeagueIds.includes(entry.league_id);
            return (
              <View
                key={entry.league_id}
                style={[styles.rankRow, isMyLeague && styles.rankRowHighlight]}
              >
                <Text style={styles.medal}>{medals[i]}</Text>
                <Text style={styles.leagueEmoji}>{entry.emoji}</Text>
                <Text
                  style={[styles.leagueName, isMyLeague && styles.leagueNameHighlight]}
                  numberOfLines={1}
                >
                  {entry.name}
                </Text>
                <Text style={[styles.leagueXP, isMyLeague && styles.leagueXPHighlight]}>
                  {entry.total_weekly_xp.toLocaleString()} XP
                </Text>
              </View>
            );
          })}
        </View>

        {/* My league rank if not in top 3 */}
        {myRank && myRank > 3 && myLeagueEntry && (
          <View style={styles.myRankRow}>
            <Text style={styles.myRankDots}>···</Text>
            <View style={[styles.rankRow, styles.rankRowHighlight]}>
              <Text style={styles.myRankNumber}>#{myRank}</Text>
              <Text style={styles.leagueEmoji}>{myLeagueEntry.emoji}</Text>
              <Text style={[styles.leagueName, styles.leagueNameHighlight]} numberOfLines={1}>
                {myLeagueEntry.name}
              </Text>
              <Text style={[styles.leagueXP, styles.leagueXPHighlight]}>
                {myLeagueEntry.total_weekly_xp.toLocaleString()} XP
              </Text>
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
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  swordEmoji: {
    fontSize: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  viewAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  rankingsContainer: {
    gap: 6,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 6,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  rankRowHighlight: {
    backgroundColor: COLORS.accent + '0D',
  },
  medal: {
    fontSize: 14,
    width: 22,
    textAlign: 'center',
  },
  leagueEmoji: {
    fontSize: 16,
  },
  leagueName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  leagueNameHighlight: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  leagueXP: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  leagueXPHighlight: {
    color: COLORS.accent,
  },
  myRankRow: {
    marginTop: 4,
  },
  myRankDots: {
    textAlign: 'center',
    color: COLORS.textTertiary,
    fontSize: 14,
    letterSpacing: 3,
    marginBottom: 4,
  },
  myRankNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    width: 22,
    textAlign: 'center',
  },
});
