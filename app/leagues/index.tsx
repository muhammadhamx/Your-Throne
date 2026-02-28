import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useLeagueStore } from '@/stores/leagueStore';
import type { League } from '@/types/database';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

function LeagueRow({ league, index }: { league: League; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify().damping(18)}>
      <TouchableOpacity
        style={styles.leagueCard}
        onPress={() => router.push(`/leagues/${league.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.leagueEmojiCircle}>
          <Text style={styles.leagueEmoji}>{league.emoji}</Text>
        </View>
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
        <View style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={14} color={COLORS.accent} />
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    ({ item, index }: { item: League; index: number }) => (
      <LeagueRow league={item} index={index} />
    ),
    []
  );

  const keyExtractor = useCallback((item: League) => item.id, []);

  const ListHeader = (
    <View>
      {/* Global Rankings button */}
      <Animated.View entering={FadeInDown.delay(30).springify().damping(18)}>
        <TouchableOpacity
          style={styles.globalRankingsBtn}
          onPress={() => router.push('/leagues/global')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GRADIENTS.gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.globalRankingsGradient}
          >
            <Text style={styles.globalRankingsEmoji}>⚔️</Text>
            <View style={styles.globalRankingsInfo}>
              <Text style={styles.globalRankingsTitle}>Global League Rankings</Text>
              <Text style={styles.globalRankingsDesc}>See how leagues compete worldwide</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.primaryDark} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(50).springify().damping(18)} style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButtonPrimary}
          onPress={() => router.push('/leagues/create')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GRADIENTS.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primaryDark} />
            <Text style={styles.actionTextPrimary}>Create League</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonSecondary}
          onPress={() => router.push('/leagues/join')}
          activeOpacity={0.8}
        >
          <Ionicons name="key-outline" size={18} color={COLORS.accent} />
          <Text style={styles.actionTextSecondary}>Join with Code</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const ListEmpty = !isLoading ? (
    <Animated.View
      entering={FadeInDown.delay(200).springify().damping(18)}
      style={styles.emptyContainer}
    >
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyEmoji}>🏰</Text>
      </View>
      <Text style={styles.emptyTitle}>No Leagues Yet</Text>
      <Text style={styles.emptyText}>
        Create a private league and invite friends, or join one using a 6-character code.
      </Text>
    </Animated.View>
  ) : null;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Royal Throne Leagues',
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 17, color: COLORS.text },
        }}
      />

      {leagues.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(30).springify().damping(18)}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>My Leagues</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{leagues.length}</Text>
          </View>
        </Animated.View>
      )}

      <FlatList
        data={leagues}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING['2xl'],
    gap: SPACING.xs,
  },
  globalRankingsBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    ...SHADOWS.glowWarm,
  },
  globalRankingsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  globalRankingsEmoji: {
    fontSize: 22,
  },
  globalRankingsInfo: {
    flex: 1,
  },
  globalRankingsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  globalRankingsDesc: {
    fontSize: 11,
    color: COLORS.primaryDark,
    opacity: 0.7,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionButtonPrimary: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  actionTextPrimary: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    ...SHADOWS.card,
  },
  actionTextSecondary: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  leagueEmojiCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexShrink: 0,
  },
  leagueEmoji: {
    fontSize: 22,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  leagueDesc: {
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    paddingHorizontal: SPACING['2xl'],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyEmoji: {
    fontSize: 36,
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
