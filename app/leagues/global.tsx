import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useLeagueStore } from '@/stores/leagueStore';
import { useAuthStore } from '@/stores/authStore';
import type { GlobalLeagueEntry } from '@/types/database';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

function GlobalLeagueRow({
  entry,
  index,
  isMyLeague,
}: {
  entry: GlobalLeagueEntry;
  index: number;
  isMyLeague: boolean;
}) {
  const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

  const getRankBg = () => {
    if (index === 0) return GRADIENTS.gold;
    if (index === 1) return ['#8E8E9A', '#6B6B7A'] as [string, string];
    if (index === 2) return ['#C2885A', '#A06040'] as [string, string];
    return null;
  };

  const rankBg = getRankBg();

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(18)}>
      <TouchableOpacity
        style={[
          styles.row,
          isMyLeague && styles.rowHighlight,
          index === 0 && styles.rowFirst,
        ]}
        onPress={() => router.push(`/leagues/${entry.league_id}`)}
        activeOpacity={0.7}
      >
        {/* Rank column */}
        <View style={styles.rankCol}>
          {medal && rankBg ? (
            <LinearGradient
              colors={rankBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.medalCircle}
            >
              <Text style={styles.medalText}>{medal}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.rankCircle}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
          )}
        </View>

        {/* League emoji */}
        <View style={[styles.emojiCircle, index === 0 && styles.emojiCircleFirst]}>
          <Text style={[styles.emoji, index === 0 && styles.emojiFirst]}>
            {entry.emoji}
          </Text>
        </View>

        {/* Name + members */}
        <View style={styles.nameCol}>
          <Text
            style={[
              styles.name,
              isMyLeague && styles.nameHighlight,
              index === 0 && styles.nameFirst,
            ]}
            numberOfLines={1}
          >
            {entry.name}
            {isMyLeague ? ' (You)' : ''}
          </Text>
          <Text style={styles.memberLabel}>
            {entry.member_count} {entry.member_count === 1 ? 'member' : 'members'}
          </Text>
        </View>

        {/* XP */}
        <View style={styles.xpCol}>
          <Text style={[styles.xp, isMyLeague && styles.xpHighlight]}>
            {entry.total_weekly_xp.toLocaleString()}
          </Text>
          <Text style={styles.xpUnit}>XP</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GlobalLeagueScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const { globalLeaderboard, leagues, isLoading, loadGlobalLeaderboard } = useLeagueStore();
  const [refreshing, setRefreshing] = useState(false);

  const myLeagueIds = leagues.map((l) => l.id);

  useEffect(() => {
    loadGlobalLeaderboard();
  }, [loadGlobalLeaderboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGlobalLeaderboard();
    setRefreshing(false);
  }, [loadGlobalLeaderboard]);

  const renderItem = useCallback(
    ({ item, index }: { item: GlobalLeagueEntry; index: number }) => (
      <GlobalLeagueRow
        entry={item}
        index={index}
        isMyLeague={myLeagueIds.includes(item.league_id)}
      />
    ),
    [myLeagueIds]
  );

  const keyExtractor = useCallback((item: GlobalLeagueEntry) => item.league_id, []);

  const ListHeader = (
    <Animated.View entering={FadeInDown.delay(50).springify().damping(18)}>
      <View style={styles.headerCard}>
        <LinearGradient
          colors={GRADIENTS.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerIconCircle}
        >
          <Text style={styles.headerEmoji}>⚔️</Text>
        </LinearGradient>
        <Text style={styles.headerTitle}>Global League Rankings</Text>
        <Text style={styles.headerDesc}>
          Leagues ranked by total weekly XP of all members combined. Resets every Monday.
        </Text>
      </View>

      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardTitle}>This Week's Rankings</Text>
        {globalLeaderboard.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{globalLeaderboard.length}</Text>
            <Text style={styles.countLabel}> leagues</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const ListEmpty = !isLoading ? (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🏰</Text>
      <Text style={styles.emptyTitle}>No Leagues Yet</Text>
      <Text style={styles.emptyText}>
        Create or join a league to compete globally!
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Global Rankings',
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 17, color: COLORS.text },
        }}
      />

      <FlatList
        data={globalLeaderboard}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    paddingBottom: SPACING['2xl'],
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  headerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  headerEmoji: {
    fontSize: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  leaderboardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accent,
  },
  countLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowHighlight: {
    backgroundColor: COLORS.accent + '0D',
  },
  rowFirst: {
    paddingVertical: SPACING.md,
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
  },
  medalCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    fontSize: 14,
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexShrink: 0,
  },
  emojiCircleFirst: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderColor: COLORS.accentWarm + '40',
    borderWidth: 2,
  },
  emoji: {
    fontSize: 20,
  },
  emojiFirst: {
    fontSize: 24,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  nameHighlight: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  nameFirst: {
    fontSize: 15,
    fontWeight: '800',
  },
  memberLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  xpCol: {
    alignItems: 'flex-end',
  },
  xp: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  xpHighlight: {
    color: COLORS.accent,
  },
  xpUnit: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    paddingHorizontal: SPACING['2xl'],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
