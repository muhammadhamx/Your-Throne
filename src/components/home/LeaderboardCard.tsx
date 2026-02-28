import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/database';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';

const THRONE_LABELS = [
  'Supreme Sitter',
  'Vice Sitter',
  'Chancellor of the Bowl',
];

const HEADER_QUIPS = [
  'Who rules the throne room?',
  'The porcelain elite',
  'Top sitters this season',
  'Hall of Throne Fame',
];

function getRankBackground(index: number): readonly [string, string] {
  switch (index) {
    case 0: return ['#F5A623', '#E8940A'] as const;
    case 1: return ['#9BA8B5', '#7A8A9A'] as const;
    case 2: return ['#CD7F32', '#A0622A'] as const;
    default: return [COLORS.surfaceElevated, COLORS.surfaceElevated] as const;
  }
}

function Row({ entry, index, isMe }: { entry: LeaderboardEntry; index: number; isMe: boolean }) {
  const medal = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
  const isTop3 = index < 3;
  const rankBg = isTop3 ? getRankBackground(index) : null;

  return (
    <View style={[styles.row, isMe && !isTop3 && styles.rowHighlight]}>
      {/* Rank */}
      <View style={styles.rankCol}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={styles.rankNum}>{index + 1}</Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[
        styles.avatarCircle,
        isTop3 && { backgroundColor: rankBg ? rankBg[0] + '22' : 'transparent' },
        isMe && { borderColor: COLORS.accent + '60', borderWidth: 1.5 },
      ]}>
        <Text style={styles.avatarEmoji}>{entry.avatar_emoji}</Text>
      </View>

      {/* Name + label */}
      <View style={styles.nameCol}>
        <Text
          style={[
            styles.name,
            isMe && styles.nameSelf,
            index === 0 && styles.nameFirst,
          ]}
          numberOfLines={1}
        >
          {entry.display_name || 'Anonymous Pooper'}{isMe ? ' (You)' : ''}
        </Text>
        {index < 3 && (
          <Text style={styles.throneLabel}>{THRONE_LABELS[index]}</Text>
        )}
      </View>

      {/* XP */}
      <View style={styles.xpCol}>
        <Text style={[styles.xp, isMe && styles.xpSelf]}>
          {entry.xp.toLocaleString()}
        </Text>
        <Text style={styles.xpUnit}>XP</Text>
      </View>
    </View>
  );
}

export function LeaderboardCard() {
  const userId = useAuthStore((s) => s.user?.id);
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const quip = useMemo(
    () => HEADER_QUIPS[Math.floor(Math.random() * HEADER_QUIPS.length)],
    []
  );

  const load = useCallback(async () => {
    try {
      const data = await getLeaderboard();
      setAllEntries(data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || allEntries.length === 0) return null;

  const top3 = allEntries.slice(0, 3);
  const totalCount = allEntries.length;
  const userIndex = allEntries.findIndex((e) => e.id === userId);
  const userInTop3 = userIndex >= 0 && userIndex < 3;
  const showUserRow = userIndex >= 3;
  const userEntry = userIndex >= 0 ? allEntries[userIndex] : null;

  return (
    <Animated.View
      entering={FadeInDown.delay(250).duration(500).springify()}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.trophyCircle}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Royal Throne Royalty</Text>
            <Text style={styles.headerQuip}>{quip}</Text>
          </View>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{totalCount} sitters</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Top 3 rows */}
      {top3.map((entry, index) => (
        <Row key={entry.id} entry={entry} index={index} isMe={entry.id === userId} />
      ))}

      {/* Separator + user row if outside top 3 */}
      {showUserRow && userEntry && (
        <>
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>{totalCount} total</Text>
            <View style={styles.separatorLine} />
          </View>
          <Row entry={userEntry} index={userIndex} isMe />
        </>
      )}

      {/* Footer note */}
      {userInTop3 && totalCount > 3 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You're top {userIndex + 1} of {totalCount} throne sitters 🔥
          </Text>
        </View>
      )}
      {userIndex < 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Start a session to appear on the board 🚽
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  trophyCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accentWarm + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentWarm + '22',
  },
  trophyEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerQuip: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  countPill: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  rowHighlight: {
    backgroundColor: COLORS.accent + '0C',
  },
  rankCol: {
    width: 26,
    alignItems: 'center',
  },
  medal: {
    fontSize: 20,
  },
  rankNum: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textTertiary,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  nameSelf: {
    color: COLORS.accent,
  },
  nameFirst: {
    fontSize: 14,
    fontWeight: '800',
  },
  throneLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  xpCol: {
    alignItems: 'flex-end',
  },
  xp: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  xpSelf: {
    color: COLORS.accent,
  },
  xpUnit: {
    fontSize: 9,
    color: COLORS.textTertiary,
    fontWeight: '700',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
