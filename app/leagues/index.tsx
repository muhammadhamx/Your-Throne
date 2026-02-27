import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore';
import type { League } from '@/types/database';
import { COLORS, SHADOWS } from '@/utils/constants';

function LeagueRow({ league }: { league: League }) {
  return (
    <TouchableOpacity
      style={styles.leagueCard}
      onPress={() => router.push(`/leagues/${league.id}`)}
      activeOpacity={0.7}
    >
      <Text style={styles.leagueEmoji}>{league.emoji}</Text>
      <View style={styles.leagueInfo}>
        <Text style={styles.leagueName} numberOfLines={1}>
          {league.name}
        </Text>
        {league.description && (
          <Text style={styles.leagueDesc} numberOfLines={1}>
            {league.description}
          </Text>
        )}
      </View>
      <Text style={styles.leagueArrow}>→</Text>
    </TouchableOpacity>
  );
}

export default function LeaguesListScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const { leagues, isLoading, loadMyLeagues } = useLeagueStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userId) loadMyLeagues(userId);
  }, [userId, loadMyLeagues]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await loadMyLeagues(userId);
    setRefreshing(false);
  }, [userId, loadMyLeagues]);

  const renderItem = useCallback(
    ({ item }: { item: League }) => <LeagueRow league={item} />,
    []
  );

  const keyExtractor = useCallback((item: League) => item.id, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Throne Leagues' }} />

      <FlatList
        data={leagues}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/leagues/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionEmoji}>⚔️</Text>
              <Text style={styles.actionText}>Create League</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionJoin]}
              onPress={() => router.push('/leagues/join')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionEmoji}>🔑</Text>
              <Text style={styles.actionJoinText}>Join League</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏰</Text>
              <Text style={styles.emptyTitle}>No Leagues Yet</Text>
              <Text style={styles.emptyText}>
                Create a league and invite your friends, or join one with a code!
              </Text>
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
    padding: 16,
    paddingBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 14,
    ...SHADOWS.glow,
  },
  actionJoin: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  actionJoinText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  leagueEmoji: {
    fontSize: 28,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  leagueDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  leagueArrow: {
    fontSize: 18,
    color: COLORS.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
