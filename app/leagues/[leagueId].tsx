import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore';
import type { LeagueLeaderboardEntry } from '@/types/database';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

function LeaderboardRow({
  entry,
  index,
  isMe,
}: {
  entry: LeagueLeaderboardEntry;
  index: number;
  isMe: boolean;
}) {
  const medal = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

  const getRankBg = () => {
    if (index === 0) return GRADIENTS.accent;
    if (index === 1) return ['#8E8E9A', '#6B6B7A'] as [string, string];
    if (index === 2) return ['#C2885A', '#A06040'] as [string, string];
    return null;
  };

  const rankBg = getRankBg();

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(18)}>
      <View
        style={[
          styles.row,
          isMe && styles.rowHighlight,
          index === 0 && styles.rowFirst,
        ]}
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

        {/* Avatar */}
        <View style={[styles.avatarCircle, index === 0 && styles.avatarCircleFirst]}>
          <Text style={[styles.avatarEmoji, index === 0 && styles.avatarEmojiFirst]}>
            {entry.avatar_emoji}
          </Text>
        </View>

        {/* Name */}
        <View style={styles.nameCol}>
          <Text
            style={[
              styles.name,
              isMe && styles.nameHighlight,
              index === 0 && styles.nameFirst,
            ]}
            numberOfLines={1}
          >
            {entry.display_name || 'Anonymous'}
            {isMe ? ' (You)' : ''}
          </Text>
        </View>

        {/* XP */}
        <View style={styles.xpCol}>
          <Text style={[styles.xp, isMe && styles.xpHighlight]}>
            {entry.weekly_xp.toLocaleString()}
          </Text>
          <Text style={styles.xpUnit}>XP</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function LeagueDetailScreen() {
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const {
    currentLeague,
    leaderboard,
    isLoading,
    loadLeague,
    loadLeaderboard,
    leave,
    remove,
  } = useLeagueStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (leagueId) {
      loadLeague(leagueId);
      loadLeaderboard(leagueId);
    }
  }, [leagueId, loadLeague, loadLeaderboard]);

  const onRefresh = useCallback(async () => {
    if (!leagueId) return;
    setRefreshing(true);
    await loadLeaderboard(leagueId);
    setRefreshing(false);
  }, [leagueId, loadLeaderboard]);

  const handleCopyCode = async () => {
    if (!currentLeague) return;
    await Clipboard.setStringAsync(currentLeague.join_code);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied!', `League code "${currentLeague.join_code}" copied to clipboard.`);
  };

  const handleLeave = () => {
    if (!leagueId || !userId) return;
    Alert.alert('Leave League', 'Are you sure you want to leave this league?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          await leave(leagueId, userId);
          router.back();
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!leagueId) return;
    Alert.alert(
      'Delete League',
      'This will permanently delete the league for all members. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await remove(leagueId);
            router.back();
          },
        },
      ]
    );
  };

  const isCreator = currentLeague?.created_by === userId;

  const renderItem = useCallback(
    ({ item, index }: { item: LeagueLeaderboardEntry; index: number }) => (
      <LeaderboardRow entry={item} index={index} isMe={item.user_id === userId} />
    ),
    [userId]
  );

  const keyExtractor = useCallback((item: LeagueLeaderboardEntry) => item.user_id, []);

  const ListHeader = currentLeague ? (
    <Animated.View entering={FadeInDown.delay(50).springify().damping(18)}>
      {/* League header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerEmojiCircle}>
          <Text style={styles.headerEmoji}>{currentLeague.emoji}</Text>
        </View>
        <Text style={styles.headerName}>{currentLeague.name}</Text>
        {currentLeague.description && (
          <Text style={styles.headerDesc}>{currentLeague.description}</Text>
        )}

        {/* Join Code */}
        <TouchableOpacity style={styles.codeRow} onPress={handleCopyCode} activeOpacity={0.7}>
          <Ionicons name="key-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.codeLabel}>Join Code</Text>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{currentLeague.join_code}</Text>
          </View>
          <View style={styles.copyHint}>
            <Ionicons name="copy-outline" size={12} color={COLORS.accent} />
            <Text style={styles.copyHintText}>Copy</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Leaderboard section header */}
      <View style={styles.leaderboardHeader}>
        <View style={styles.leaderboardTitleRow}>
          <Text style={styles.leaderboardTitle}>Weekly Leaderboard</Text>
          <Text style={styles.weeklyNote}>resets every Monday</Text>
        </View>
        {leaderboard.length > 0 && (
          <View style={styles.memberBadge}>
            <Text style={styles.memberCount}>{leaderboard.length}</Text>
            <Text style={styles.memberLabel}> members</Text>
          </View>
        )}
      </View>
    </Animated.View>
  ) : null;

  const ListEmpty = !isLoading ? (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No members yet</Text>
    </View>
  ) : null;

  const ListFooter = currentLeague ? (
    <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.footerActions}>
      <TouchableOpacity
        style={styles.dangerButton}
        onPress={isCreator ? handleDelete : handleLeave}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isCreator ? 'trash-outline' : 'exit-outline'}
          size={16}
          color={COLORS.error}
        />
        <Text style={styles.dangerText}>
          {isCreator ? 'Delete League' : 'Leave League'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  ) : null;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: currentLeague?.name ?? 'League',
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 17, color: COLORS.text },
        }}
      />

      <FlatList
        data={leaderboard}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
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
  headerEmojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  headerEmoji: {
    fontSize: 34,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  codeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  codeBadge: {
    flex: 1,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 4,
  },
  copyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  copyHintText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  leaderboardTitleRow: {
    gap: 2,
  },
  leaderboardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  weeklyNote: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberCount: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accent,
  },
  memberLabel: {
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
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexShrink: 0,
  },
  avatarCircleFirst: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderColor: COLORS.accent + '40',
    borderWidth: 2,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  avatarEmojiFirst: {
    fontSize: 22,
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
    paddingVertical: SPACING['3xl'],
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  footerActions: {
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '50',
    backgroundColor: COLORS.errorBg,
  },
  dangerText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
