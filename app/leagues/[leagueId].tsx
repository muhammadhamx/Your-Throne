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
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore';
import type { LeagueLeaderboardEntry } from '@/types/database';
import { COLORS, SHADOWS } from '@/utils/constants';

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

  return (
    <View style={[styles.row, isMe && styles.rowHighlight, index === 0 && styles.rowFirst]}>
      <View style={styles.rankCol}>
        {medal ? (
          <Text style={[styles.medal, index === 0 && styles.medalFirst]}>{medal}</Text>
        ) : (
          <Text style={styles.rankNumber}>{index + 1}</Text>
        )}
      </View>
      <Text style={[styles.avatar, index === 0 && styles.avatarFirst]}>
        {entry.avatar_emoji}
      </Text>
      <View style={styles.nameCol}>
        <Text
          style={[styles.name, isMe && styles.nameHighlight, index === 0 && styles.nameFirst]}
          numberOfLines={1}
        >
          {entry.display_name || 'Anonymous Pooper'}{isMe ? ' (You)' : ''}
        </Text>
      </View>
      <View style={styles.xpCol}>
        <Text style={[styles.xp, isMe && styles.xpHighlight]}>
          {entry.weekly_xp}
        </Text>
        <Text style={styles.xpUnit}>this week</Text>
      </View>
    </View>
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: currentLeague?.name ?? 'League' }}
      />

      <FlatList
        data={leaderboard}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          currentLeague ? (
            <View>
              {/* League Header */}
              <View style={styles.headerCard}>
                <Text style={styles.headerEmoji}>{currentLeague.emoji}</Text>
                <Text style={styles.headerName}>{currentLeague.name}</Text>
                {currentLeague.description && (
                  <Text style={styles.headerDesc}>{currentLeague.description}</Text>
                )}

                {/* Join Code */}
                <TouchableOpacity style={styles.codeRow} onPress={handleCopyCode}>
                  <Text style={styles.codeLabel}>Join Code:</Text>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeText}>{currentLeague.join_code}</Text>
                  </View>
                  <Text style={styles.codeCopy}>tap to copy</Text>
                </TouchableOpacity>
              </View>

              {/* Leaderboard Header */}
              <View style={styles.leaderboardHeader}>
                <Text style={styles.leaderboardTitle}>Weekly Leaderboard</Text>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberCount}>{leaderboard.length}</Text>
                </View>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No members yet</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          currentLeague ? (
            <View style={styles.footerActions}>
              {isCreator ? (
                <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
                  <Text style={styles.dangerText}>Delete League</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.dangerButton} onPress={handleLeave}>
                  <Text style={styles.dangerText}>Leave League</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
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
    paddingBottom: 32,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
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
    marginTop: 6,
    lineHeight: 20,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  codeLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  codeBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  codeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 3,
  },
  codeCopy: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  memberBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberCount: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  rowHighlight: {
    backgroundColor: COLORS.accent + '12',
  },
  rowFirst: {
    paddingVertical: 16,
  },
  rankCol: {
    width: 28,
    alignItems: 'center',
  },
  medal: {
    fontSize: 18,
  },
  medalFirst: {
    fontSize: 22,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  avatar: {
    fontSize: 22,
  },
  avatarFirst: {
    fontSize: 28,
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
    color: COLORS.textLight,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  footerActions: {
    padding: 16,
    paddingTop: 24,
  },
  dangerButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
